import type { ServerResponse } from 'node:http';

export function sendJson<T>(
  res: ServerResponse,
  status: number,
  payload: { data?: T; error?: string; meta?: Record<string, unknown> }
) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export function sendHtml(res: ServerResponse, status: number, html: string) {
  res.writeHead(status, { 'Content-Type': 'text/html' });
  res.end(html);
}
