# AL3D — Fluxo de Caixa Inteligente

Aplicação moderna de gestão e controle de fluxo de caixa desenvolvida especialmente para operações de impressão 3D e pedidos sob demanda. 

Substitui a conferência manual em bloco de notas ou WhatsApp por um dashboard dinâmico, rápido e em tempo real.

---

## 🚀 Tecnologias

- **Frontend / Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript, React 19)
- **Estilização:** CSS Tokens / Dark Slate Theme com estética SaaS premium
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (executado via Docker Compose)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Ícones:** Lucide React

---

## ✨ Funcionalidades

- **Cálculo Dinâmico:** Saldo Líquido, Total de Entradas e Total de Saídas calculados automaticamente em tempo real.
- **Navegação por Mês:** Alterne facilmente entre os meses para conferir faturamento e histórico.
- **Lançamento Rápido (Tecla `N`):** Modal otimizado para cadastrar entradas e saídas com poucos cliques ou atalhos de teclado.
- **Status de Pagamento:** Suporte para status de pagamento parcial (*ex: 50% pago / restante na entrega*).
- **Dark Mode Nativo:** Interface de alto contraste e baixa fadiga visual.
- **Mobile-First:** Perfeitamente adaptado para uso tanto no desktop quanto na tela do smartphone.

---

## 🛠️ Como Executar o Projeto

### 1. Pré-requisitos
- Node.js (v18+ recomendado)
- Docker & Docker Compose
- Git

### 2. Clonar o repositório
```bash
git clone git@github.com:RacconWebFenix/al3d.git
cd al3d
```

### 3. Subir o Banco de Dados (PostgreSQL)
```bash
docker compose up -d
```
> O banco subirá mapeado na porta `5433` localmente conforme configurado em `docker-compose.yml`.

### 4. Configurar as Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

### 5. Instalar Dependências e Sincronizar o Prisma
```bash
npm install
npx prisma db push
```

### 6. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📦 Estrutura do Projeto

```
al3d/
├── prisma/
│   └── schema.prisma        # Modelagem do banco (Transaction, Category)
├── src/
│   ├── app/
│   │   ├── api/transactions # Endpoints REST de criação e listagem
│   │   ├── globals.css      # Design tokens e estilos globais
│   │   ├── layout.tsx       # Layout raiz
│   │   └── page.tsx         # Dashboard principal
│   ├── components/          # Componentes modulares (Modal de Lançamento, etc.)
│   └── lib/                 # Cliente Prisma e utilitários
├── docker-compose.yml       # Orquestração do PostgreSQL
└── README.md
```
