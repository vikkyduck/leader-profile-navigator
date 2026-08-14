/**
 * Клиент собственного бэкенда на том же сервере, что и статика.
 * Внешних облаков нет: ответы уходят на /api и лежат в SQLite рядом с сайтом.
 */

export type Instrument =
  | 'blue-ocean'
  | 'leadership'
  | 'indicator'
  | 'resource'
  | 'edtech-risk'
  | 'motivation';

export interface TeamAggregate {
  count: number;
  averages: Record<string, number>;
}

export interface MotivationTeamSummary {
  teamId: string;
  responses: number;
  significance: number[];
  enablement: number[];
}

export interface MotivationRow {
  teamId: string;
  createdAt: string;
  significance: number[];
  enablement: number[];
}

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* тело может быть пустым — оставляем код */
    }
    const error = new Error(message) as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}

/** Отправить анкету. scores — объект оценок по шкалам инструмента. */
export function submitResponse(
  instrument: Instrument,
  teamId: string,
  scores: Record<string, unknown>
): Promise<{ ok: true }> {
  return request('/responses', {
    method: 'POST',
    body: JSON.stringify({ instrument, teamId, scores }),
  });
}

/** Среднее по команде. Для мотивации сервер отвечает отказом — так и задумано. */
export function loadTeamAggregate(instrument: Instrument, teamId: string): Promise<TeamAggregate> {
  return request(`/responses/${instrument}/${encodeURIComponent(teamId)}`);
}

export function loadMotivationSummary(key: string): Promise<{ teams: MotivationTeamSummary[] }> {
  return request(`/motivation/summary?key=${encodeURIComponent(key)}`);
}

export function loadMotivationRows(key: string, team?: string): Promise<{ rows: MotivationRow[] }> {
  const teamPart = team ? `&team=${encodeURIComponent(team)}` : '';
  return request(`/motivation/rows?key=${encodeURIComponent(key)}${teamPart}`);
}
