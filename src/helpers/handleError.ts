import type { ServerResponse } from 'node:http';
import { AppError } from '../middleware/errors.js';
import { sendHtml, sendJson } from './sendResponse.js';

export function handleError(err: unknown, res: ServerResponse) {
  console.error('Error:', err);
  const isApiRequest = res.req?.url?.startsWith('/api/') ?? false;

  if (err instanceof AppError) {
    const status = err.statusCode;
    const message = err.message;

    if (isApiRequest) {
      sendJson(res, status, { error: message });
    } else {
      sendHtml(res, status, `<h1>Error ${status}</h1><p>${message}</p>`);
    }
    return;
  }

  if (isApiRequest) {
    sendJson(res, 500, { error: 'Internal Server Error' });
  } else {
    sendHtml(res, 500, '<h1>500 Internal Server Error</h1>');
  }
}
