import { Response } from "express";
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import { AppError } from "./AppError";
import { logger } from "./logger";

interface HttpError {
  status: number;
  message: string;
}

const INTERNAL_ERROR_MESSAGE = "Erro interno do servidor.";

// Converte qualquer erro em status HTTP + mensagem segura para o cliente.
export function toHttpError(error: unknown, defaultStatus = 500): HttpError {
  if (error instanceof AppError) {
    return { status: error.statusCode, message: error.message };
  }

  if (error instanceof UniqueConstraintError) {
    return { status: 409, message: "Registro já cadastrado." };
  }

  if (error instanceof ForeignKeyConstraintError) {
    return {
      status: 409,
      message: "Operação não permitida: registro vinculado a outros dados.",
    };
  }

  if (error instanceof ValidationError) {
    return {
      status: 400,
      message: error.errors.map((e) => e.message).join(", ") || "Dados inválidos.",
    };
  }

  if (error instanceof Error) {
    // Formato legado "mensagem|status" usado pelos controllers.
    const [message, status] = error.message.split("|");

    if (status) {
      return { status: Number(status), message };
    }

    if (defaultStatus < 500) {
      return { status: defaultStatus, message };
    }
  }

  return { status: defaultStatus, message: INTERNAL_ERROR_MESSAGE };
}

// Envia a resposta de erro e registra no log com o nível adequado.
export function sendError(
  res: Response,
  error: unknown,
  defaultStatus = 500,
): Response {
  const { status, message } = toHttpError(error, defaultStatus);

  if (status >= 500) {
    logger.error("http.erro_interno", {
      status,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn("http.erro_requisicao", { status, error: message });
  }

  return res.status(status).json({ error: message });
}
