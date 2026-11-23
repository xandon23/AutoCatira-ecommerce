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
  // Referências usadas pelo app para abrir a tela certa ao tocar.
  vehicleId: string | null;
  proposalId: string | null;
  vehicleTitle: string | null;
}

// Regra de negócio: para cada evento, quem deve ser avisado e com qual texto.
export function notificationsFromEvent(envelope: EventEnvelope): NotificationDraft[] {
  const d = envelope.data;
  const vehicle = d.vehicleTitle ? `o ${d.vehicleTitle}` : "o seu anúncio";
  const refs = {
    vehicleId: d.vehicleId ?? null,
    proposalId: d.proposalId ?? null,
    vehicleTitle: d.vehicleTitle ?? null,
  };

  switch (envelope.event) {
    case "proposta.criada":
      return [
        {
          ...refs,
          userId: d.sellerId,
          type: "NOVA_PROPOSTA",
          title: "Nova proposta recebida",
          message: d.comTroca
            ? `Você recebeu uma proposta com veículo na troca para ${vehicle}.`
            : `Você recebeu uma nova proposta em dinheiro para ${vehicle}.`,
        },
      ];

    case "proposta.status_alterado":
      return [
        {
          ...refs,
          userId: d.buyerId,
          type: d.para === "IN_NEGOTIATION" ? "PROPOSTA_EM_NEGOCIACAO" : "PROPOSTA_RECUSADA",
          title: d.para === "IN_NEGOTIATION" ? "Proposta aceita para negociação" : "Proposta recusada",
          message:
            d.para === "IN_NEGOTIATION"
              ? `O vendedor aceitou negociar ${vehicle}. O contato dele já está disponível.`
              : `O vendedor recusou a sua proposta para ${vehicle}.`,
        },
      ];

    case "veiculo.vendido":
      return [
        {
          ...refs,
          userId: d.buyerId,
          type: "VENDA_CONCLUIDA",
          title: "Negócio fechado!",
          message: `A compra de ${vehicle} foi concluída. Avalie o vendedor.`,
        },
        {
          ...refs,
          userId: d.sellerId,
          type: "VENDA_CONCLUIDA",
          title: "Venda concluída",
          message: `A venda de ${vehicle} foi registrada. Avalie o comprador.`,
        },
      ];

    case "avaliacao.criada":
      return [
        {
          ...refs,
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
