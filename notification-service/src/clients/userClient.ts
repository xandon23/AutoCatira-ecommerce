import { env } from "../config/env";
import { redisClient } from "../config/redis";
import { logger, errorMessage } from "../utils/logger";

export interface UserSummary {
  id: string;
  name: string;
}

export type UserLookup =
  | { status: "FOUND"; user: UserSummary; source: "cache" | "api" }
  | { status: "NOT_FOUND" }
  | { status: "UNAVAILABLE" };

const TIMEOUT_MS = 2000;
const MAX_ATTEMPTS = 3;
const cacheKey = (id: string) => `notif:user:${id}`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function findUser(userId: string, requestId?: string): Promise<UserLookup> {
  try {
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey(userId));
      if (cached) {
        logger.info("cache.hit", { key: cacheKey(userId) });
        return { status: "FOUND", user: JSON.parse(cached), source: "cache" };
      }
      logger.info("cache.miss", { key: cacheKey(userId) });
    }
  } catch (error) {
    logger.warn("cache.erro_leitura", { error: errorMessage(error) });
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${env.mainApiUrl}/internal/users/${encodeURIComponent(userId)}`, {
        headers: {
          "X-Internal-Token": env.internalToken,
          ...(requestId ? { "X-Request-Id": requestId } : {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 404) return { status: "NOT_FOUND" };
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const user = (await response.json()) as UserSummary;

      try {
        if (redisClient.isReady) {
          await redisClient.set(cacheKey(userId), JSON.stringify(user), { EX: env.userCacheTtlSeconds });
        }
      } catch (error) {
        logger.warn("cache.erro_gravacao", { error: errorMessage(error) });
      }

      logger.info("api_principal.usuario_validado", { userId, tentativa: attempt });
      return { status: "FOUND", user, source: "api" };
    } catch (error) {
      logger.warn("api_principal.falha", { userId, tentativa: attempt, error: errorMessage(error) });
      if (attempt < MAX_ATTEMPTS) await wait(300 * 2 ** (attempt - 1));
    }
  }

  return { status: "UNAVAILABLE" };
}

export async function isMainApiUp(): Promise<boolean> {
  try {
    const r = await fetch(`${env.mainApiUrl}/health`, { signal: AbortSignal.timeout(1000) });
    return r.ok;
  } catch {
    return false;
  }
}
