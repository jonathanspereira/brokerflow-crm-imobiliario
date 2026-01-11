
# 🏠 BrokerFlow CRM Imobiliário

**Status**: Produção | **Última Atualização**: 2026

## 📦 Sobre o Projeto

BrokerFlow é um CRM imobiliário completo, pronto para uso em produção via Docker. Inclui frontend (Next.js), backend (Node.js/Express/Prisma), banco de dados PostgreSQL e integrações modernas (WhatsApp, billing, documentos, times, RBAC, etc).

## 🚀 Deploy Rápido com Docker

1. Clone o repositório:
  ```bash
  git clone https://github.com/sua-org/brokerflow-crm.git
  cd brokerflow-crm
  ```
2. Configure as variáveis de ambiente:
  - Copie `.env.production.example` para `.env.production` e ajuste os valores (veja instruções no próprio arquivo).
  - Configure secrets seguros para JWT, ENCRYPTION_KEY, senhas e URLs.
3. Execute o build e o deploy:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
  ```
4. Acesse:
  - **Frontend**: http://localhost:3000
  - **API**: http://localhost:3001/api/v1
  - **Swagger**: http://localhost:3001/api-docs

> Para produção, utilize bancos e secrets externos, e configure variáveis de ambiente seguras.

## 📄 Documentação

- [MELHORIAS_CHECKLIST.md](./MELHORIAS_CHECKLIST.md) — Progresso e melhorias
- [API_GUIDE.md](./API_GUIDE.md) — Exemplos de uso da API
- [ALIGNMENT_ANALYSIS.md](./ALIGNMENT_ANALYSIS.md) — Alinhamento backend/frontend

## 🛡️ Segurança

- Nunca use valores padrão de secrets em produção.
- Gere JWT_SECRET, ENCRYPTION_KEY e senhas fortes (veja `.env.production.example`).
- Configure CORS e variáveis de domínio corretamente.

## 👤 Usuários e Acesso

- Multi-tenant: múltiplas agências
- RBAC: SUPER_ADMIN, ADMIN, AUTONOMO, GESTOR, CORRETOR
- Cadastro flexível, times, permissões e billing

## 📚 Recursos

- Pipeline de leads, inventário, times, WhatsApp, documentos, billing, dashboard, settings, etc.

## 🐳 Docker Compose

Scripts úteis:
```bash
./start.sh                 # Inicia todos os serviços
./stop.sh                  # Para todos os serviços
```

## 📝 Suporte

Abra issues ou contribua via pull request.

---
**BrokerFlow CRM** — Software livre para o mercado imobiliário.

## 📋 Arquitetura

| Componente | Tecnologia | Porta |
|-----------|-----------|-------|
| Frontend | Next.js 14.2.35 | 3000 |
| Backend | Node.js + Express | 3001 |
| Database | PostgreSQL | 5432 |

**Stack**: React + Tailwind | Express + Prisma | PostgreSQL

## 🔐 Autenticação

- **Super Admin**: jonathanpereira.jsp@outlook.com / rX6+T@US+f;v2=D
- JWT tokens + bcryptjs password hashing
- Roles: SUPER_ADMIN, ADMIN, AUTONOMO, GESTOR, CORRETOR

## � Tipos de Usuário

Os usuários escolhem seu tipo no cadastro:

| Tipo | Agência | Acesso | Uso |
|------|---------|--------|-----|
| Autônomo | Própria | Completo | Corretor independente |
| Corretor | Padrão | Completo | Corretor em imobiliária |
| Admin | Padrão | Completo | Gerenciador da imobiliária |

## 📦 Recursos Principais

✅ Multi-tenant (múltiplas agências)  
✅ RBAC (Role-Based Access Control)  
✅ Tipos de usuário no cadastro (Autônomo, Corretor, Admin)  
✅ Gestão de Teams com managers  
✅ Pipeline de Leads  
✅ Inventário de Imóveis  
✅ WhatsApp via Baileys  
✅ Documentos com templates Handlebars  

## 📁 Estrutura

```
crm/
├── start.sh, stop.sh, test-connectivity.sh
├── docker-compose.yml
├── crm_imob_backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── prisma/schema.prisma
├── crm_imob_frontend/
│   ├── app/
│   │   ├── (public)/ [login, landing]
│   │   └── (private)/crm/ [dashboard, leads, teams, billing, settings]
│   └── components/
└── README.md [este arquivo]
```

## 🔧 Scripts

```bash
./start.sh                 # Inicia tudo (PostgreSQL, Backend, Frontend)
./stop.sh                  # Para todos os serviços
```

## � Documentação Técnica

### Arquitetura & Alinhamento
- **[ALIGNMENT_ANALYSIS.md](./ALIGNMENT_ANALYSIS.md)** - Análise completa de 48 endpoints (100% implementados)
- **[API_GUIDE.md](./API_GUIDE.md)** - Exemplos de consumo e cURL

### Docker & Deploy
- **[DOCKER_COMPATIBILITY_REPORT.md](./DOCKER_COMPATIBILITY_REPORT.md)** - Validação completa de compatibilidade
- **[DOCKER_OPTIMIZATION_GUIDE.md](./DOCKER_OPTIMIZATION_GUIDE.md)** - Guia de otimização para produção

### API Documentation
- **Swagger UI**: http://localhost:3001/api-docs
- **Endpoints**: http://localhost:3001/api/v1

## 🐛 Troubleshooting

**Porta em uso**:
```bash
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
kill -9 <PID>
```

**Banco não conecta**:
```bash
docker-compose logs postgres
docker-compose down -v && docker-compose up -d
```

**Limpar build**:
```bash
rm -rf .next crm_imob_backend/dist
npm run dev  # Frontend
npm run dev  # Backend
```

## 📚 Modelos de Dados

- **Agencia**: Empresa holding
- **Equipe**: Times dentro da agência  
- **User**: Corretores, gestores, admins
- **Lead**: Contatos/oportunidades
- **Imovel**: Propriedades à venda
- **Venda**: Transações completadas
- **Simulacao**: Simulações de financiamento

## 🔗 APIs Principais

**Auth**:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/refresh-token`

**Leads**:
- `GET /api/v1/leads`
- `POST /api/v1/leads`
- `PUT /api/v1/leads/:id`

**Teams**:
- `GET /api/v1/teams`
- `POST /api/v1/teams`
- `POST /api/v1/teams/:id/add-member`

**Billing**:
- `GET /api/v1/billing/plans` (pricing dinâmico)
## 📖 Documentação Interativa (Swagger)

Acesse a documentação completa com exemplos interativos:

**URL**: http://localhost:3001/api-docs

**Recursos**:
- ✅ Todos os endpoints documentados
- ✅ Descrição de parâmetros e respostas
- ✅ Schemas de requisição/resposta
- ✅ Testar endpoints diretamente na UI
- ✅ Autenticação JWT integrada (copie seu token)

**Como usar**:
1. Abra http://localhost:3001/api-docs
2. Faça login para obter um JWT token
3. Clique no cadeado e paste seu token
4. Teste qualquer endpoint interativamente

**Guia de Consumo da API**: Veja [API_GUIDE.md](API_GUIDE.md) para exemplos com cURL

## 📊 Análise de Alinhamento Backend-Frontend

Veja [ALIGNMENT_ANALYSIS.md](ALIGNMENT_ANALYSIS.md) para uma análise detalhada:
- ✅ 85% de cobertura de endpoints
- ⚠️ Identificação de gaps
- 📝 Recomendações de implementação
- 🎯 Priorização de tarefas

**Status**: A maioria dos endpoints estão implementados. Faltam alguns services e refinamentos.

## 👤 Controle de Acesso (RBAC)

```
SUPER_ADMIN
  ├─ Acesso administrativo completo
  └─ Full system rights

ADMIN
  ├─ Gerencia agência
  ├─ Cria/edita leads
  └─ Gerencia teams

AUTONOMO
  ├─ Gerencia apenas sua agência
  ├─ Acesso completo ao sistema
  └─ Sem teams (trabalha solo)

GESTOR
  ├─ Gerencia team
  ├─ Visibilidade de leads
  └─ Acesso limitado

CORRETOR
  ├─ Cria/edita leads
  └─ Visibilidade limitada
```

## 📊 Funcionalidades por Página

| Página | Descrição |
|--------|-----------|
| `/` | Landing page com WhatsApp |
| `/auth/login` | Autenticação JWT |
| `/crm` | Dashboard principal |
| `/crm/leads` | Pipeline de vendas |
| `/crm/inventory` | Gestão de imóveis |
| `/crm/teams` | Gerenciamento de times |
| `/crm/billing` | Planos e faturas |
| `/crm/settings` | Configurações + pricing (SUPER_ADMIN) |

## 🚀 Deploy

1. Variáveis de ambiente em `.env` (backend) e `.env.local` (frontend)
2. PostgreSQL em nuvem (AWS RDS, Render, etc)
3. Node.js 18+ necessário
4. Build: `npm run build` em ambos os diretórios

## 📞 Contato

- **Email**: vendas@brokerflow.com
- **WhatsApp**: Integrado via Baileys
- **Dev**: Jonathan Pereira

---

**BrokerFlow v1.0** | Desenvolvido com ❤️ para o mercado imobiliário

