import { Router, Request, Response, NextFunction } from "express";
import User from "../models/User";

const router = Router();

// Rotas internas: usadas apenas por outros serviços do ecossistema
// (ex.: notification-service), protegidas por um token compartilhado.
// Não são expostas pelo Nginx.
function internalAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected || req.headers["x-internal-token"] !== expected) {
    return res.status(401).json({ error: "Acesso interno não autorizado." });
  }
  return next();
}

// Validação de usuário para o microsserviço de notificações
// (retorna só o mínimo: id e nome).
router.get("/users/:id", internalAuth, async (req, res) => {
  const user = await User.findByPk(req.params.id as string, {
    attributes: ["id", "name"],
  });

  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  return res.json({ id: user.id, name: user.name });
});

export default router;
