/**
 * Разовый перенос данных из Supabase в локальный SQLite.
 *
 * Ожидает каталог с выгрузками таблиц (по файлу на таблицу, JSON-массив строк),
 * какие отдаёт PostgREST: node server/import-supabase.js <каталог> <файл-базы>
 *
 * Повторный запуск для уже перенесённого инструмента ничего не делает —
 * чтобы случайно не удвоить анкеты.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [, , dumpDir, dbPath] = process.argv;
if (!dumpDir || !dbPath) {
  console.error('Использование: node import-supabase.js <каталог-выгрузок> <файл-базы>');
  process.exit(1);
}

/** Таблица Supabase → инструмент. Служебные колонки в оценки не попадают. */
const TABLES = {
  'blue_ocean_responses.json': 'blue-ocean',
  'anonymous_team_responses.json': 'leadership',
  'indicator_radar_responses.json': 'indicator',
  'resource_radar_responses.json': 'resource',
  'edtech_risk_responses.json': 'edtech-risk',
};

const SERVICE_COLUMNS = new Set(['id', 'team_id', 'created_at', 'updated_at', 'user_id']);
/** Строки, созданные при отладке, переносить незачем */
const SKIP_TEAMS = new Set(['proverka-claude', 'claude-test']);

mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
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

const countStmt = db.prepare('SELECT count(*) AS n FROM responses WHERE instrument = ?');
const insertStmt = db.prepare(
  'INSERT INTO responses (instrument, team_id, scores, created_at) VALUES (?, ?, ?, ?)'
);

let total = 0;
for (const [file, instrument] of Object.entries(TABLES)) {
  let rows;
  try {
    rows = JSON.parse(readFileSync(join(dumpDir, file), 'utf8'));
  } catch {
    console.log(`${instrument}: файла ${file} нет, пропускаю`);
    continue;
  }

  const already = countStmt.get(instrument).n;
  if (already > 0) {
    console.log(`${instrument}: уже ${already} анкет, пропускаю`);
    continue;
  }

  let imported = 0;
  for (const row of rows) {
    if (SKIP_TEAMS.has(row.team_id)) continue;
    const scores = Object.fromEntries(
      Object.entries(row)
        .filter(([k]) => !SERVICE_COLUMNS.has(k))
        .map(([k, v]) => [k, Number(v) || 0])
    );
    insertStmt.run(
      instrument,
      String(row.team_id),
      JSON.stringify(scores),
      row.created_at ?? new Date().toISOString()
    );
    imported++;
  }
  total += imported;
  console.log(`${instrument}: перенесено ${imported} из ${rows.length}`);
}

console.log(`Готово. Всего перенесено ${total} анкет в ${dbPath}`);
