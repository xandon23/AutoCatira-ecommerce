// Eventos de domínio publicados pelo AutoCatira.
// Cada evento vira um canal no Redis: "autocatira:eventos:<nome>".

export const EVENT_CHANNEL_PREFIX = "autocatira:eventos:";

export interface DomainEvents {
  "proposta.criada": {
    proposalId: string;
    vehicleId: string;
    buyerId: string;
    sellerId: string;
    comTroca: boolean;
  };
  "proposta.status_alterado": {
    proposalId: string;
    vehicleId: string;
    buyerId: string;
    de: string;
    para: string;
  };
  "veiculo.vendido": {
    vehicleId: string;
    sellerId: string;
    buyerId: string;
    comTroca: boolean;
    propostasRejeitadas: number;
  };
  "avaliacao.criada": {
    reviewId: string;
    proposalId: string;
    reviewedId: string;
    rating: number;
  };
}

export type EventName = keyof DomainEvents;

export interface EventEnvelope<E extends EventName = EventName> {
  event: E;
  occurredAt: string;
  requestId?: string;
  data: DomainEvents[E];
}
