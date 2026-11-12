import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  requestId: string;
}

// Guarda o ID da requisição atual para que todos os logs gerados
// durante o seu processamento possam ser relacionados entre si.
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
