import { randomUUID } from "crypto";
import { EventEnvelope, notificationsFromEvent } from "../domain/notification";
import { notificationRepository } from "../repositories/notificationRepository";
import { findUser } from "../clients/userClient";
import { logger, errorMessage } from "../utils/logger";

// Casos de uso do microsserviço.
export const notificationService = {
  // Recebe um evento de domínio (assíncrono, via Redis) e gera as notificações.
  async handleEvent(envelope: EventEnvelope): Promise<void> {
    const drafts = notificationsFromEvent(envelope);
    const eventId = envelope.eventId ?? randomUUID();

    for (const draft of drafts) {
      if (!draft.userId) continue;

      const { notification, created } = await notificationRepository.createIfAbsent(
        eventId,
        envelope.event,
        draft,
        envelope.requestId,
      );

      if (!created) {
        logger.info("notificacao.duplicada_ignorada", { eventId, userId: draft.userId });
        continue;
      }

      await this.deliver(notification.id, draft.userId, envelope.requestId);
    }
  },

  // Valida o destinatário na API principal (com cache) e decide o status.
  // Se a API estiver fora, a notificação fica PENDENTE e é reprocessada
  // depois: CONSISTÊNCIA EVENTUAL entre os dois serviços.
  async deliver(notificationId: string, userId: string, requestId?: string | null): Promise<void> {
    const lookup = await findUser(userId, requestId ?? undefined);

    if (lookup.status === "FOUND") {
      await notificationRepository.updateStatus(notificationId, "ENTREGUE", lookup.user.name);
      logger.info("notificacao.entregue", { notificationId, userId, usuario: lookup.user.name, origemUsuario: lookup.source });
    } else if (lookup.status === "NOT_FOUND") {
      await notificationRepository.updateStatus(notificationId, "DESCARTADA");
      logger.warn("notificacao.descartada", { notificationId, userId, motivo: "usuario_inexistente" });
    } else {
      await notificationRepository.updateStatus(notificationId, "PENDENTE");
      logger.warn("notificacao.pendente", { notificationId, userId, motivo: "api_principal_indisponivel" });
    }
  },

  // Rotina de reconciliação: tenta de novo as notificações pendentes.
  async reconcilePending(): Promise<void> {
    try {
      const pending = await notificationRepository.findPending();
      if (pending.length === 0) return;
      logger.info("reconciliacao.iniciada", { pendentes: pending.length });
      for (const n of pending) {
        await this.deliver(n.id, n.userId, n.requestId);
      }
    } catch (error) {
      logger.error("reconciliacao.erro", { error: errorMessage(error) });
    }
  },

  listForUser(userId: string) {
    return notificationRepository.findDeliveredByUser(userId);
  },

  markAsRead(id: string, userId: string) {
    return notificationRepository.markAsRead(id, userId);
  },

  stats() {
    return notificationRepository.countByStatus();
  },
};
