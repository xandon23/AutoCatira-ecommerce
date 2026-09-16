import api from "./api";

export interface RegisterUserInput {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  password: string;
}

export async function registerUser(data: RegisterUserInput): Promise<void> {
  await api.post("/users", data);
}
