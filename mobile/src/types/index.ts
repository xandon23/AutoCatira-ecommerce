export type UserRole = "USER" | "ADMIN";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: IUser;
}
