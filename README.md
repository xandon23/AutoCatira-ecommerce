# AutoCatira - Marketplace de Automóveis

Plataforma de e-commerce para compra, venda e negociação (catira) de automóveis, desenvolvida com tecnologias modernas de web.

## 🚗 Sobre o Projeto

O **AutoCatira** é um sistema web moderno e responsivo desenvolvido para facilitar transações automotivas. Além da compra e venda tradicional, a plataforma foca na cultura da "catira" (troca), permitindo que usuários ofereçam seus próprios veículos como parte do pagamento em negociações seguras e transparentes. A plataforma oferece uma experiência completa para listagem de veículos, avaliações, propostas de compra e gerenciamento de usuários.

## 🛠️ Stack Tecnológico

### Backend

- **Node.js** com **Express.js**
- **TypeScript** para type safety
- **Sequelize** como ORM
- **MySQL/PostgreSQL** como banco de dados
- **JWT** para autenticação
- **Vitest** para testes

### Frontend

- **React 19**
- **React Router v7** para navegação
- **Axios** para requisições HTTP
- **TypeScript** para type safety
- **React Scripts** com Webpack

## 📋 Pré-requisitos

- Node.js (v18+)
- npm ou yarn
- MySQL ou PostgreSQL
- Git

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/xandon23/AutoCatira-ecommerce.git
cd AutoCatira-ecommerce
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Configurar banco de dados
npm run db:migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend estará disponível em `http://localhost:3001`

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm start
```

O frontend estará disponível em `http://localhost:3000`

## 📚 Estrutura do Projeto

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── models/          # Modelos do banco de dados
│   │   ├── routes/          # Definição de rotas
│   │   ├── middlewares/     # Middlewares Express
│   │   ├── config/          # Configurações
│   │   ├── utils/           # Funções utilitárias
│   │   ├── types/           # Tipos TypeScript
│   │   └── app.ts           # App principal
│   ├── __tests__/           # Testes
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes React
    │   ├── pages/           # Páginas da aplicação
    │   └── App.tsx          # App principal
    └── package.json
```

## 🔑 Funcionalidades Principais

- ✅ Autenticação de usuários (JWT)
- ✅ Listagem e filtragem de veículos
- ✅ Upload de imagens de veículos
- ✅ Sistema de propostas de compra
- ✅ Avaliações e comentários
- ✅ Painel de usuário
- ✅ Gerenciamento de anúncios

## 🧪 Testes

### Backend

```bash
cd backend
npm run test          # Executar testes em modo watch
npm run test:run      # Executar testes uma vez
```

### Frontend

```bash
cd frontend
npm test              # Executar testes
```

## 📝 Scripts Disponíveis

### Backend

- `npm run dev` - Iniciar servidor em desenvolvimento
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar servidor em produção
- `npm run test` - Executar testes
- `npm run db:migrate` - Executar migrações do banco
- `npm run db:migrate:undo` - Reverter última migração

### Frontend

- `npm start` - Iniciar app em desenvolvimento
- `npm run build` - Build para produção
- `npm test` - Executar testes
- `npm run lint` - Executar linter

## 🔒 Variáveis de Ambiente

### Backend (.env)

```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=autocatira
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3001
```

## 🤝 Contribuição

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Commit suas mudanças (`git commit -m 'feat: descrição da feature'`)
3. Push para a branch (`git push origin feature/MinhaFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença ISC.

## 👤 Autor

**xandon23**

- GitHub: [@xandon23](https://github.com/xandon23)

## 📞 Suporte

Para reportar bugs ou sugerir features, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para conectar compradores e vendedores de automóveis**
