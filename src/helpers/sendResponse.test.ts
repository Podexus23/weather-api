import type { ServerResponse } from 'node:http';
import { sendJson } from './sendResponse.js';

describe('sendJson', () => {
  it('should write JSON response with correct headers', () => {
    const res = {
      writeHead: () => {},
      end: () => {},
    } as unknown as ServerResponse;
    const writeHeadSpy = vi.spyOn(res, 'writeHead');
    const endSpy = vi.spyOn(res, 'end');

    const payload = { data: { id: 1, name: 'Test' } };
    const statusCode = 200;
    sendJson(res, statusCode, payload);

    expect(writeHeadSpy).toHaveBeenCalledWith(statusCode, { 'Content-Type': 'application/json' });
    expect(endSpy).toHaveBeenCalledWith(JSON.stringify(payload));
  });

  it('should handle error payload', () => {
    const res = {
      writeHead: () => {},
      end: () => {},
    } as unknown as ServerResponse;
    const writeHeadSpy = vi.spyOn(res, 'writeHead');
    const endSpy = vi.spyOn(res, 'end');

    const payload = { error: 'Not found' };
    const status = 404;

    sendJson(res, status, payload);

    expect(writeHeadSpy).toHaveBeenCalledWith(status, { 'Content-Type': 'application/json' });
    expect(endSpy).toHaveBeenCalledWith(JSON.stringify(payload));
  });

  it('should include meta if provided', () => {
    const res = {
      writeHead: () => {},
      end: () => {},
    } as unknown as ServerResponse;
    const endSpy = vi.spyOn(res, 'end');

    const payload = { data: [], meta: { page: 1, total: 10 } };
    const status = 200;

    sendJson(res, status, payload);

    expect(endSpy).toHaveBeenCalledWith(JSON.stringify(payload));
  });
});
