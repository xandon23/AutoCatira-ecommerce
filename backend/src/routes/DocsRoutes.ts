import { Router } from "express";
import path from "path";

const router = Router();

const SPEC_PATH = path.resolve(process.cwd(), "docs", "openapi.yaml");

// Página do Swagger UI (carregada de CDN, sem dependência no backend).
// O caminho da especificação é relativo à página, então funciona tanto
// em /docs quanto em /api/docs (atrás do Nginx).
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>AutoCatira API - Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    var base = window.location.pathname.replace(/\\/?$/, "/");
    window.ui = SwaggerUIBundle({ url: base + "openapi.yaml", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

router.get("/", (req, res) => {
  res.type("html").send(html);
});

router.get("/openapi.yaml", (req, res) => {
  res.type("text/yaml").sendFile(SPEC_PATH);
});

export default router;
