// Erro de negócio com código HTTP. Lançado pelas regras da aplicação
// e convertido em resposta pelo tratamento de erros centralizado.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
