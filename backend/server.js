/**
 * API - Painel de Endereços | Hospital Albert Sabin
 * Backend Node.js + Express + SQLite + Swagger (OpenAPI)
 * Desenvolvido por Gustavo Barbosa
 */
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import swaggerUi from "swagger-ui-express";
import { randomUUID } from "node:crypto";

const PORT = process.env.PORT || 3333;
const db = new Database(process.env.DB_FILE || "servicos.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    protocol TEXT NOT NULL DEFAULT 'http',
    address TEXT NOT NULL,
    port TEXT DEFAULT '',
    path TEXT DEFAULT '',
    description TEXT DEFAULT '',
    favorite INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

// Registro inicial de exemplo
if (db.prepare("SELECT COUNT(*) c FROM services").get().c === 0) {
  db.prepare(
    `INSERT INTO services (id,name,category,protocol,address,port,path,description,favorite,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    randomUUID(),
    "FindFace",
    "Segurança",
    "http",
    "10.40.0.23",
    "",
    "",
    "Reconhecimento facial – controle de acesso",
    1,
    new Date().toISOString(),
  );
}

const app = express();
app.use(cors());
app.use(express.json());

const toApi = (r) => ({ ...r, favorite: !!r.favorite });

const serviceSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "b1f2c3d4" },
    name: { type: "string", example: "FindFace" },
    category: { type: "string", example: "Segurança" },
    protocol: { type: "string", enum: ["http", "https"], example: "http" },
    address: { type: "string", example: "10.40.0.23" },
    port: { type: "string", example: "8080" },
    path: { type: "string", example: "/login" },
    description: { type: "string", example: "Reconhecimento facial" },
    favorite: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "API - Painel de Endereços | Hospital Albert Sabin",
    version: "1.0.0",
    description:
      "Cadastro dos endereços IP dos sistemas internos do hospital. Desenvolvido por Gustavo Barbosa.",
  },
  servers: [{ url: "http://localhost:" + PORT }],
  paths: {
    "/api/services": {
      get: {
        summary: "Lista todos os serviços",
        responses: {
          200: {
            description: "Lista de serviços",
            content: {
              "application/json": { schema: { type: "array", items: serviceSchema } },
            },
          },
        },
      },
      post: {
        summary: "Cadastra um novo serviço",
        requestBody: {
          required: true,
          content: { "application/json": { schema: serviceSchema } },
        },
        responses: { 201: { description: "Serviço criado" } },
      },
    },
    "/api/services/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: { summary: "Busca um serviço", responses: { 200: { description: "OK" }, 404: { description: "Não encontrado" } } },
      put: {
        summary: "Atualiza um serviço",
        requestBody: { required: true, content: { "application/json": { schema: serviceSchema } } },
        responses: { 200: { description: "Atualizado" }, 404: { description: "Não encontrado" } },
      },
      delete: { summary: "Exclui um serviço", responses: { 204: { description: "Excluído" } } },
    },
    "/api/services/export/csv": {
      get: { summary: "Exporta todos os serviços em CSV", responses: { 200: { description: "Arquivo CSV" } } },
    },
    "/api/services/import/csv": {
      post: {
        summary: "Importa serviços a partir de um CSV (texto puro no corpo)",
        requestBody: { required: true, content: { "text/plain": { schema: { type: "string" } } } },
        responses: { 201: { description: "Importados" } },
      },
    },
  },
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (_req, res) => res.json(openapi));

app.get("/api/services", (_req, res) => {
  res.json(db.prepare("SELECT * FROM services ORDER BY favorite DESC, name").all().map(toApi));
});

app.get("/api/services/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Serviço não encontrado" });
  res.json(toApi(row));
});

function upsert(id, b) {
  db.prepare(
    `INSERT INTO services (id,name,category,protocol,address,port,path,description,favorite,createdAt)
     VALUES (@id,@name,@category,@protocol,@address,@port,@path,@description,@favorite,@createdAt)
     ON CONFLICT(id) DO UPDATE SET name=@name,category=@category,protocol=@protocol,address=@address,
       port=@port,path=@path,description=@description,favorite=@favorite`,
  ).run({
    id,
    name: b.name,
    category: b.category || "Outros",
    protocol: b.protocol === "https" ? "https" : "http",
    address: b.address,
    port: b.port || "",
    path: b.path || "",
    description: b.description || "",
    favorite: b.favorite ? 1 : 0,
    createdAt: new Date().toISOString(),
  });
  return toApi(db.prepare("SELECT * FROM services WHERE id = ?").get(id));
}

app.post("/api/services", (req, res) => {
  const { name, address } = req.body || {};
  if (!name || !address) return res.status(400).json({ error: "name e address são obrigatórios" });
  res.status(201).json(upsert(randomUUID(), req.body));
});

app.put("/api/services/:id", (req, res) => {
  const exists = db.prepare("SELECT 1 FROM services WHERE id = ?").get(req.params.id);
  if (!exists) return res.status(404).json({ error: "Serviço não encontrado" });
  res.json(upsert(req.params.id, req.body));
});

app.delete("/api/services/:id", (req, res) => {
  db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

const HEADERS = ["name", "category", "protocol", "address", "port", "path", "description", "favorite"];
const esc = (v) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

app.get("/api/services/export/csv", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services ORDER BY name").all();
  const csv = [
    HEADERS.join(","),
    ...rows.map((r) => HEADERS.map((h) => esc(String(h === "favorite" ? !!r[h] : (r[h] ?? "")))).join(",")),
  ].join("\n");
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.attachment("enderecos-hospital-albert-sabin.csv");
  res.send(csv);
});

app.post("/api/services/import/csv", express.text({ type: "*/*", limit: "2mb" }), (req, res) => {
  const lines = String(req.body).split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return res.status(400).json({ error: "CSV vazio" });
  const head = lines[0].toLowerCase().split(/[,;]/).map((h) => h.trim());
  const hasHeader = head.includes("address") || head.includes("name");
  let count = 0;
  for (const line of hasHeader ? lines.slice(1) : lines) {
    const c = line.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.trim().replace(/^"|"$/g, ""));
    const get = (k, i) => (hasHeader ? (c[head.indexOf(k)] ?? "") : (c[i] ?? ""));
    const address = get("address", 3);
    if (!address) continue;
    upsert(randomUUID(), {
      name: get("name", 0) || "Sem nome",
      category: get("category", 1),
      protocol: get("protocol", 2),
      address,
      port: get("port", 4),
      path: get("path", 5),
      description: get("description", 6),
      favorite: get("favorite", 7).toLowerCase() === "true",
    });
    count++;
  }
  res.status(201).json({ imported: count });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`Swagger em    http://localhost:${PORT}/docs`);
});
