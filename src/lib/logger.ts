type Level = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

interface LogEntry extends LogContext {
  ts: string;
  level: Level;
  message: string;
}

function emit(level: Level, message: string, ctx?: LogContext): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(ctx ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
  /** Logger préfixé pour scoper un run de worker */
  child(scope: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) => emit("debug", msg, { ...scope, ...ctx }),
      info: (msg: string, ctx?: LogContext) => emit("info", msg, { ...scope, ...ctx }),
      warn: (msg: string, ctx?: LogContext) => emit("warn", msg, { ...scope, ...ctx }),
      error: (msg: string, ctx?: LogContext) => emit("error", msg, { ...scope, ...ctx }),
    };
  },
};
