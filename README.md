# Painel de Endereços — Hospital Albert Sabin

Painel para cadastrar, editar, excluir e abrir rapidamente os sistemas internos do hospital
(ex.: FindFace em `http://10.40.0.23`), com importação e exportação em CSV.

Desenvolvido por **Gustavo Barbosa**.

---

## Estrutura

```
index.html            → frontend (na raiz, pronto para GitHub Pages)
backend/server.js     → API Node.js + Express + SQLite + Swagger
backend/package.json  → dependências da API
exemplo.csv           → modelo de importação
```

## 1) Frontend (funciona sozinho)

Basta abrir o `index.html` no navegador — ou publicar no GitHub Pages:

1. Crie um repositório no GitHub e envie estes arquivos (o `index.html` deve ficar na **raiz**).
2. Vá em **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. O site ficará em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

Sem backend, os dados ficam salvos no navegador (localStorage).

## 2) Backend com banco de dados + Swagger

```bash
cd backend
npm install
npm start
```

- API: `http://localhost:3333/api/services`
- **Swagger (documentação interativa): `http://localhost:3333/docs`**
- Banco de dados SQLite gerado automaticamente em `backend/servicos.db`

### Conectar o frontend à API

No painel, clique no botão **⚙ API** e informe a URL do servidor
(ex.: `http://10.40.0.10:3333`). Deixe em branco para voltar ao modo local.

### Endpoints

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| GET | `/api/services` | Lista os serviços |
| GET | `/api/services/{id}` | Busca um serviço |
| POST | `/api/services` | Cadastra |
| PUT | `/api/services/{id}` | Edita |
| DELETE | `/api/services/{id}` | Exclui |
| GET | `/api/services/export/csv` | Exporta CSV |
| POST | `/api/services/import/csv` | Importa CSV |

## 3) Formato do CSV

```csv
name,category,protocol,address,port,path,description,favorite
FindFace,Segurança,http,10.40.0.23,,,Reconhecimento facial,true
```
# Projeto
# Projeto
# controlip
# controlip
# painel_enderecos_as
# painel_enderecos_as
# painel_enderecos_as
# painel_enderecos_as
