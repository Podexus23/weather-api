interface SystemError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}

export function isSystemError(err: unknown): err is SystemError {
  return err instanceof Error && 'code' in err;
}
