// Domínio do contexto de Notificações: o que é uma notificação e qual
// notificação cada evento de negócio gera. Não conhece banco nem HTTP.

export type NotificationStatus = "PENDENTE" | "ENTREGUE" | "DESCARTADA";

export interface EventEnvelope {
  eventId?: string;
  event: string;
  occurredAt: string;
  requestId?: string;
  data: Record<string, any>;
}

export interface NotificationDraft {
  userId: string;
  type: string;
  title: string;
  message: string;
}

// Regra de negócio: para cada evento, quem deve ser avisado e com qual texto.
export function notificationsFromEvent(envelope: EventEnvelope): NotificationDraft[] {
  const d = envelope.data;

  switch (envelope.event) {
    case "proposta.criada":
      return [
        {
          userId: d.sellerId,
          type: "NOVA_PROPOSTA",
          title: "Nova proposta recebida",
          message: d.comTroca
            ? "Você recebeu uma proposta com veículo na troca para o seu anúncio."
            : "Você recebeu uma nova proposta em dinheiro para o seu anúncio.",
        },
      ];

    case "proposta.status_alterado":
      return [
        {
          userId: d.buyerId,
          type: d.para === "IN_NEGOTIATION" ? "PROPOSTA_EM_NEGOCIACAO" : "PROPOSTA_RECUSADA",
          title: d.para === "IN_NEGOTIATION" ? "Proposta aceita para negociação" : "Proposta recusada",
          message:
            d.para === "IN_NEGOTIATION"
              ? "O vendedor aceitou negociar. O contato dele já está disponível no app."
              : "O vendedor recusou a sua proposta.",
        },
      ];

    case "veiculo.vendido":
      return [
        {
          userId: d.buyerId,
          type: "VENDA_CONCLUIDA",
          title: "Negócio fechado!",
          message: "A venda foi concluída. Avalie o vendedor no app.",
        },
        {
          userId: d.sellerId,
          type: "VENDA_CONCLUIDA",
          title: "Venda concluída",
          message: "Sua venda foi registrada. Avalie o comprador no app.",
        },
      ];

    case "avaliacao.criada":
      return [
        {
          userId: d.reviewedId,
          type: "NOVA_AVALIACAO",
          title: "Você recebeu uma avaliação",
          message: `Você recebeu uma avaliação de ${d.rating} estrela(s).`,
        },
      ];

    default:
      return [];
  }
}
