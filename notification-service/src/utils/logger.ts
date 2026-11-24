import { AsyncLocalStorage } from "async_hooks";

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

type Level = "info" | "warn" | "error";

function write(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    service: "notification-service",
    event,
    requestId: requestContext.getStore()?.requestId,
    ...meta,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => write("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => write("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) => write("error", event, meta),
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
