// Configuração do microsserviço (variáveis vindas do docker-compose).
export const env = {
  port: Number(process.env.PORT) || 3334,
  db: {
    host: process.env.DB_HOST || "notification-db",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || "autocatira_notifications",
    user: process.env.DB_USER || "notificacoes",
    password: process.env.DB_PASSWORD || "",
  },
  redisUrl: process.env.REDIS_URL || "redis://redis:6379",
  jwtSecret: process.env.JWT_SECRET || "",
  // Comunicação síncrona com a API principal (validação de usuário).
  mainApiUrl: process.env.MAIN_API_URL || "http://backend:3333",
  internalToken: process.env.INTERNAL_API_TOKEN || "",
  userCacheTtlSeconds: 300,
  reconcileIntervalMs: 30000,
};
