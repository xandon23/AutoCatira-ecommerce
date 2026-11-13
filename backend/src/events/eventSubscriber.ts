import { redisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { requestContext } from "../utils/requestContext";
import { EVENT_CHANNEL_PREFIX, EventEnvelope, EventName } from "./eventTypes";

type Handler = (envelope: EventEnvelope) => Promise<void> | void;

// O que acontece quando cada evento chega. Hoje os assinantes registram
// notificações para as partes; no futuro podem enviar push, e-mail etc.
const handlers: Partial<Record<EventName, Handler>> = {
  "proposta.criada": ({ data }) => {
    const d = data as EventEnvelope<"proposta.criada">["data"];
    logger.info("notificacao.vendedor_nova_proposta", {
      sellerId: d.sellerId,
      vehicleId: d.vehicleId,
      proposalId: d.proposalId,
    });
  },
  "proposta.status_alterado": ({ data }) => {
    const d = data as EventEnvelope<"proposta.status_alterado">["data"];
    logger.info("notificacao.comprador_status_proposta", {
      buyerId: d.buyerId,
      proposalId: d.proposalId,
      status: d.para,
    });
  },
  "veiculo.vendido": ({ data }) => {
    const d = data as EventEnvelope<"veiculo.vendido">["data"];
    logger.info("notificacao.avaliacao_liberada", {
      vehicleId: d.vehicleId,
      sellerId: d.sellerId,
      buyerId: d.buyerId,
    });
  },
  "avaliacao.criada": ({ data }) => {
    const d = data as EventEnvelope<"avaliacao.criada">["data"];
    logger.info("notificacao.usuario_avaliado", {
      reviewedId: d.reviewedId,
      rating: d.rating,
    });
  },
};

// O Pub/Sub exige uma conexão exclusiva para assinar canais,
// por isso o assinante usa uma cópia (duplicate) do cliente.
export async function startEventSubscriber(): Promise<void> {
  const subscriber = redisClient.duplicate();

  subscriber.on("error", () => {
    // Erros de conexão já são registrados pelo cliente principal.
  });

  try {
    await subscriber.connect();

    await subscriber.pSubscribe(`${EVENT_CHANNEL_PREFIX}*`, (message, channel) => {
      let envelope: EventEnvelope;

      try {
        envelope = JSON.parse(message) as EventEnvelope;
      } catch {
        logger.warn("evento.mensagem_invalida", { canal: channel });
        return;
      }

      // Mantém o mesmo requestId da requisição que gerou o evento,
      // permitindo seguir o fluxo completo nos logs.
      requestContext.run({ requestId: envelope.requestId ?? "evento" }, async () => {
        logger.info("evento.recebido", {
          evento: envelope.event,
          atrasoMs: Date.now() - new Date(envelope.occurredAt).getTime(),
        });

        try {
          await handlers[envelope.event]?.(envelope);
        } catch (error) {
          logger.error("evento.erro_processamento", {
            evento: envelope.event,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });

    logger.info("evento.assinante_iniciado", { canal: `${EVENT_CHANNEL_PREFIX}*` });
  } catch (error) {
    logger.warn("evento.assinante_indisponivel", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
