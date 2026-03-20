import type { ServerResponse } from 'node:http';
import { AppError } from '../middleware/errors.js';
import { sendHtml, sendJson } from './sendResponse.js';

export function handleError(err: unknown, res: ServerResponse) {
  console.error('Error:', err);
  const reqUrl = res.req?.url ?? '';
  const isApiRequest = reqUrl.startsWith('/api/');
  const isStaticRequest = reqUrl.startsWith('/public/');

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  if (err instanceof AppError) {
    const status = err.statusCode;
    const message = err.message;

    if (isApiRequest) {
      sendJson(res, status, { error: message });
    } else if (isStaticRequest) {
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end(message);
    } else {
      sendHtml(res, status, `<h1>Error ${status}</h1><p>${escapeHtml(message)}</p>`);
    }
    return;
  }

  if (isApiRequest) {
    sendJson(res, 500, { error: 'Internal Server Error' });
  } else if (isStaticRequest) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  } else {
    sendHtml(res, 500, '<h1>500 Internal Server Error</h1>');
  }
}
