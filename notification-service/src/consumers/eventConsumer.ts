import { redisSubscriber } from "../config/redis";
import { EventEnvelope } from "../domain/notification";
import { notificationService } from "../services/notificationService";
import { logger, requestContext, errorMessage } from "../utils/logger";

const CHANNEL_PATTERN = "autocatira:eventos:*";

export async function startEventConsumer(): Promise<void> {
  await redisSubscriber.connect();

  await redisSubscriber.pSubscribe(CHANNEL_PATTERN, (message, channel) => {
    let envelope: EventEnvelope;
    try {
      envelope = JSON.parse(message);
    } catch {
      logger.warn("evento.mensagem_invalida", { canal: channel });
      return;
    }

    requestContext.run({ requestId: envelope.requestId ?? "evento" }, async () => {
      logger.info("evento.recebido", {
        evento: envelope.event,
        eventId: envelope.eventId,
        atrasoMs: Date.now() - new Date(envelope.occurredAt).getTime(),
      });
      try {
        await notificationService.handleEvent(envelope);
      } catch (error) {
        logger.error("evento.erro_processamento", { evento: envelope.event, error: errorMessage(error) });
      }
    });
  });

  logger.info("evento.assinante_iniciado", { canal: CHANNEL_PATTERN });
}
