import api from "./api";
import { IUser, UserRole } from "../types";

export async function getAdminUsers(): Promise<IUser[]> {
  const response = await api.get<IUser[]>("/admin/users");

  return response.data;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<IUser> {
  const response = await api.patch(`/admin/users/${userId}/role`, {
    role,
  });

  return response.data.user;
}
