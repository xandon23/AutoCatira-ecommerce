import { isRedisReady, redisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { getRequestId } from "../utils/requestContext";
import {
  DomainEvents,
  EVENT_CHANNEL_PREFIX,
  EventEnvelope,
  EventName,
} from "./eventTypes";

// Publica um evento no Redis Pub/Sub. Falha na publicação nunca derruba
// a operação principal (a proposta/venda já foi salva no banco).
export async function publishEvent<E extends EventName>(
  event: E,
  data: DomainEvents[E],
): Promise<void> {
  const envelope: EventEnvelope<E> = {
    event,
    occurredAt: new Date().toISOString(),
    requestId: getRequestId(),
    data,
  };

  if (!isRedisReady()) {
    logger.warn("evento.nao_publicado", { evento: event, motivo: "redis_indisponivel" });
    return;
  }

  try {
    const receivers = await redisClient.publish(
      `${EVENT_CHANNEL_PREFIX}${event}`,
      JSON.stringify(envelope),
    );

    logger.info("evento.publicado", { evento: event, assinantes: receivers });
  } catch (error) {
    logger.warn("evento.erro_publicacao", {
      evento: event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
