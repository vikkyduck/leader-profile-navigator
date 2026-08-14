/**
 * Приёмник ответов для радаров. Живёт на том же VDS, что и статика,
 * данные лежат в SQLite-файле рядом — никаких внешних облаков.
 *
 * Запуск: node server/index.js
 * Переменные: PORT, DB_PATH, ADMIN_KEY
 *
 * Зависимостей нет: http и sqlite — встроенные модули Node 22+.
 */
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT ?? 5040);
const DB_PATH = process.env.DB_PATH ?? '/opt/radars-api/data/radars.db';
const ADMIN_KEY = process.env.ADMIN_KEY ?? '';

/** Инструменты и их шкалы. Ключи должны совпадать с id в src/data/*.ts */
const INSTRUMENTS = {
  'blue-ocean': ['market', 'client', 'product', 'economics', 'uniqueness', 'sustainability'],
  leadership: ['courage', 'hiring', 'responsibility', 'integration', 'sincerity'],
  indicator: [
    'platform_economy',
    'experience_economy',
    'creative_economy',
    'cognitive_engineering',
    'meaningful_legacy',
  ],
  resource: ['visionary', 'deep_worker', 'empath', 'biohacker'],
  'edtech-risk': [
    'antifragile',
    'portfolio',
    'cheap_bets',
    'risk_map',
    'switching_cost',
    'focus_core',
    'formed_demand',
    'free_resource',
    'crisis_playbook',
    'early_signals',
  ],
  // Мотивация устроена иначе: два массива по 15 оценок, и читать её
  // среднее публично нельзя — только по ключу администратора.
  motivation: null,
};

const MOTIVATION_LEN = 15;
const MOTIVATION_MAX_SAME = 3;

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument TEXT NOT NULL,
    team_id TEXT NOT NULL,
    scores TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_responses_lookup ON responses(instrument, team_id);
`);

const insertStmt = db.prepare(
  'INSERT INTO responses (instrument, team_id, scores, created_at) VALUES (?, ?, ?, ?)'
);
const selectTeamStmt = db.prepare(
  'SELECT scores, created_at FROM responses WHERE instrument = ? AND team_id = ? ORDER BY created_at'
);
const selectInstrumentStmt = db.prepare(
  'SELECT team_id, scores, created_at FROM responses WHERE instrument = ? ORDER BY team_id, created_at'
);
const selectAllStmt = db.prepare(
  'SELECT instrument, team_id, scores, created_at FROM responses ORDER BY instrument, team_id, created_at'
);

const isTeamId = (v) => typeof v === 'string' && /^[a-z0-9-]{1,50}$/.test(v);
const isScore = (v) => Number.isInteger(v) && v >= 0 && v <= 10;

/** Простая защита от заливки мусора: не больше 40 анкет с адреса в час. */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 3600_000;
  const list = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 40;
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function readBody(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error('too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/** Проверка ответов по мотивации: длина, диапазон и правило методики. */
function validateMotivation(scores) {
  for (const field of ['significance', 'enablement']) {
    const arr = scores?.[field];
    if (!Array.isArray(arr) || arr.length !== MOTIVATION_LEN) return `${field}: нужно 15 оценок`;
    if (!arr.every((v) => Number.isInteger(v) && v >= 1 && v <= 10))
      return `${field}: оценки должны быть от 1 до 10`;
  }
  const counts = new Map();
  for (const v of scores.significance) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const [score, n] of counts) {
    if (n > MOTIVATION_MAX_SAME)
      return `оценка ${score} встречается ${n} раз — по методике не более ${MOTIVATION_MAX_SAME}`;
  }
  return null;
}

function averages(rows, keys) {
  if (rows.length === 0) return {};
  const sums = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const row of rows) {
    const scores = JSON.parse(row.scores);
    for (const k of keys) sums[k] += Number(scores[k] ?? 0);
  }
  return Object.fromEntries(keys.map((k) => [k, sums[k] / rows.length]));
}

function motivationSummary(rows) {
  const empty = () => new Array(MOTIVATION_LEN).fill(0);
  const sig = empty();
  const ena = empty();
  for (const row of rows) {
    const s = JSON.parse(row.scores);
    for (let i = 0; i < MOTIVATION_LEN; i++) {
      sig[i] += Number(s.significance?.[i] ?? 0);
      ena[i] += Number(s.enablement?.[i] ?? 0);
    }
  }
  const n = rows.length || 1;
  return {
    responses: rows.length,
    significance: sig.map((v) => Number((v / n).toFixed(2))),
    enablement: ena.map((v) => Number((v / n).toFixed(2))),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket.remoteAddress;

  if (req.method === 'GET' && path === '/api/health') {
    return send(res, 200, { ok: true });
  }

  // --- Приём анкеты ---
  if (req.method === 'POST' && path === '/api/responses') {
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      return send(res, 400, { error: 'Некорректный запрос' });
    }

    const { instrument, teamId, scores } = payload ?? {};
    if (!(instrument in INSTRUMENTS)) return send(res, 400, { error: 'Неизвестный инструмент' });
    if (!isTeamId(teamId)) return send(res, 400, { error: 'Некорректный код команды' });
    if (!scores || typeof scores !== 'object') return send(res, 400, { error: 'Нет ответов' });

    if (instrument === 'motivation') {
      const problem = validateMotivation(scores);
      if (problem) return send(res, 400, { error: problem });
    } else {
      const keys = INSTRUMENTS[instrument];
      for (const k of keys) {
        if (!isScore(scores[k])) return send(res, 400, { error: `Некорректная оценка: ${k}` });
      }
    }

    if (rateLimited(ip)) return send(res, 429, { error: 'Слишком много отправок, попробуйте позже' });

    const clean =
      instrument === 'motivation'
        ? { significance: scores.significance, enablement: scores.enablement }
        : Object.fromEntries(INSTRUMENTS[instrument].map((k) => [k, scores[k]]));

    insertStmt.run(instrument, teamId, JSON.stringify(clean), new Date().toISOString());
    return send(res, 201, { ok: true });
  }

  // --- Командное среднее для обычных радаров (видно участникам) ---
  const teamMatch = path.match(/^\/api\/responses\/([a-z-]+)\/([a-z0-9-]+)$/);
  if (req.method === 'GET' && teamMatch) {
    const [, instrument, teamId] = teamMatch;
    if (!(instrument in INSTRUMENTS)) return send(res, 404, { error: 'Неизвестный инструмент' });
    // Мотивация закрыта: её средние отдаёт только админский маршрут с ключом
    if (instrument === 'motivation') return send(res, 403, { error: 'Недоступно' });

    const rows = selectTeamStmt.all(instrument, teamId);
    return send(res, 200, {
      count: rows.length,
      averages: averages(rows, INSTRUMENTS[instrument]),
    });
  }

  // --- Админские маршруты по ключу ---
  const key = url.searchParams.get('key') ?? '';
  const authorized = ADMIN_KEY.length > 0 && key === ADMIN_KEY;

  if (req.method === 'GET' && path === '/api/motivation/summary') {
    if (!authorized) return send(res, 401, { error: 'Неверный ключ доступа' });
    const rows = selectInstrumentStmt.all('motivation');
    const byTeam = new Map();
    for (const row of rows) {
      if (!byTeam.has(row.team_id)) byTeam.set(row.team_id, []);
      byTeam.get(row.team_id).push(row);
    }
    const teams = [...byTeam.entries()]
      .map(([teamId, teamRows]) => ({ teamId, ...motivationSummary(teamRows) }))
      .sort((a, b) => a.teamId.localeCompare(b.teamId));
    return send(res, 200, { teams });
  }

  if (req.method === 'GET' && path === '/api/motivation/rows') {
    if (!authorized) return send(res, 401, { error: 'Неверный ключ доступа' });
    const team = url.searchParams.get('team');
    const rows = selectInstrumentStmt
      .all('motivation')
      .filter((r) => !team || r.team_id === team)
      .map((r) => {
        const s = JSON.parse(r.scores);
        return {
          teamId: r.team_id,
          createdAt: r.created_at,
          significance: s.significance,
          enablement: s.enablement,
        };
      });
    return send(res, 200, { rows });
  }

  // Полная выгрузка — чтобы держать все данные у себя
  if (req.method === 'GET' && path === '/api/export') {
    if (!authorized) return send(res, 401, { error: 'Неверный ключ доступа' });
    const rows = selectAllStmt.all().map((r) => ({
      instrument: r.instrument,
      teamId: r.team_id,
      createdAt: r.created_at,
      scores: JSON.parse(r.scores),
    }));
    return send(res, 200, { exportedAt: new Date().toISOString(), count: rows.length, rows });
  }

  send(res, 404, { error: 'Не найдено' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Радары: API слушает 127.0.0.1:${PORT}, база ${DB_PATH}`);
});
