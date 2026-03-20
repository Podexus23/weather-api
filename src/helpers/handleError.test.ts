import { describe, it, expect, vi } from 'vitest';
import type { ServerResponse } from 'node:http';
import { handleError } from './handleError.js';
import { BadRequestError } from '../middleware/errors.js';

const createRes = (url?: string) => {
  const writeHead = vi.fn();
  const end = vi.fn();
  const res = {
    req: url ? { url } : undefined,
    headersSent: false,
    writeHead,
    end,
  } as unknown as ServerResponse;

  return { res, writeHead, end };
};

describe('helpers/handleError', () => {
  it('should send JSON for API AppError', () => {
    const { res, writeHead, end } = createRes('/api/weather?city=london');
    const err = new BadRequestError('City name is required');

    handleError(err, res);

    expect(writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
    expect(end).toHaveBeenCalledWith(JSON.stringify({ error: err.message }));
  });

  it('should send HTML for non-API AppError', () => {
    const { res, writeHead, end } = createRes('/some-page');
    const err = new BadRequestError('City name is required');

    handleError(err, res);

    expect(writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/html' });
    const html = String(end.mock.calls[0]?.[0] ?? '');
    expect(html).toContain('<h1>Error 400</h1>');
    expect(html).toContain(err.message);
  });
});
