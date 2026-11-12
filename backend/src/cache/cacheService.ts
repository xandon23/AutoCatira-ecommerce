import { isRedisReady, redisClient } from "../config/redis";
import { logger } from "../utils/logger";

// Tempo máximo de espera por uma operação no Redis. Se passar disso,
// a API segue sem cache em vez de deixar o usuário esperando.
const OPERATION_TIMEOUT_MS = 300;

export const CACHE_TTL = {
  vehicleList: 60, // segundos
  vehicleDetail: 300,
};

export const cacheKeys = {
  vehicleListPrefix: "vehicles:list:",
  vehicleList: (page: number, limit: number, includeSold: boolean) =>
    `vehicles:list:page=${page}:limit=${limit}:sold=${includeSold}`,
  vehicleDetail: (id: string) => `vehicles:detail:${id}`,
};

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Tempo limite do Redis excedido")),
        OPERATION_TIMEOUT_MS,
      ),
    ),
  ]);
}

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

// Padrão cache-aside: procura no Redis; se não achar, busca na fonte
// (MySQL), grava no Redis com TTL e devolve. Sem Redis, vai direto à fonte.
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ data: T; cache: CacheStatus }> {
  if (!isRedisReady()) {
    logger.warn("cache.bypass", { key, motivo: "redis_indisponivel" });
    return { data: await loader(), cache: "BYPASS" };
  }

  try {
    const cached = await withTimeout(redisClient.get(key));

    if (cached) {
      logger.info("cache.hit", { key });
      return { data: JSON.parse(cached) as T, cache: "HIT" };
    }
  } catch (error) {
    logger.warn("cache.erro_leitura", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return { data: await loader(), cache: "BYPASS" };
  }

  logger.info("cache.miss", { key });

  const data = await loader();

  try {
    await withTimeout(
      redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds }),
    );
  } catch (error) {
    logger.warn("cache.erro_gravacao", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { data, cache: "MISS" };
}

// Remove chaves exatas e/ou todas as chaves que começam com um prefixo.
export async function invalidate(
  keys: string[] = [],
  prefixes: string[] = [],
): Promise<void> {
  if (!isRedisReady()) return;

  try {
    const toDelete = [...keys];

    for (const prefix of prefixes) {
      for await (const batch of redisClient.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 100,
      })) {
        toDelete.push(...(Array.isArray(batch) ? batch : [batch]));
      }
    }

    if (toDelete.length > 0) {
      await withTimeout(redisClient.del(toDelete));
    }

    logger.info("cache.invalidado", { chaves: toDelete.length, prefixes });
  } catch (error) {
    logger.warn("cache.erro_invalidacao", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Atalho: qualquer mudança em um veículo invalida o detalhe dele
// e todas as páginas da listagem.
export function invalidateVehicle(vehicleId?: string): Promise<void> {
  return invalidate(
    vehicleId ? [cacheKeys.vehicleDetail(vehicleId)] : [],
    [cacheKeys.vehicleListPrefix],
  );
}
