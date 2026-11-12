import { getRequestId } from "./requestContext";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): LogLevel {
  if (process.env.NODE_ENV === "test") return "error";
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  return configured && configured in levelOrder ? configured : "info";
}

// Logger estruturado: cada linha é um JSON com data, nível, evento,
// ID da requisição e dados extras. Facilita filtrar e seguir fluxos.
function write(level: LogLevel, event: string, meta: LogMeta = {}): void {
  if (levelOrder[level] < levelOrder[minLevel()]) return;

  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    event,
    requestId: getRequestId(),
    ...meta,
  });

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (event: string, meta?: LogMeta) => write("debug", event, meta),
  info: (event: string, meta?: LogMeta) => write("info", event, meta),
  warn: (event: string, meta?: LogMeta) => write("warn", event, meta),
  error: (event: string, meta?: LogMeta) => write("error", event, meta),
};
