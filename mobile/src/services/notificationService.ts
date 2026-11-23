import api from "./api";

// Chamadas ao microsserviço de notificações (via Nginx em /api/notifications).
export interface INotification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  vehicleId: string | null;
  proposalId: string | null;
  vehicleTitle: string | null;
}

export async function getMyNotifications(): Promise<INotification[]> {
  const response = await api.get<INotification[]>("/notifications/me");

  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}
