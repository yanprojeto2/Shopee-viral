# 🎬 Shopee Viral Studio

Plataforma onde admins cadastram fotos e vídeos de produtos da Shopee, e afiliados baixam esse conteúdo para postar e ganhar comissão.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Supabase** (Auth + Database + Storage)
- **next/image** para otimização de imagens

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (free tier funciona)

---

## Como configurar o Supabase

### 1. Criar projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **New project**
3. Escolha nome, senha e região (recomendado: South America)
4. Aguarde o projeto inicializar (~2 min)

### 2. Executar o schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo de `supabase/migrations/001_initial.sql`
4. Clique em **Run**

Isso vai criar:
- Tabelas: `products`, `media`, `downloads`
- Políticas RLS configuradas
- Storage buckets: `product-photos` e `product-videos`

### 3. Copiar credenciais

1. Vá em **Project Settings → API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Como rodar localmente

### 1. Instalar dependências

```bash
cd shopee-viral-studio
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Popular o banco (seed)

```bash
npm run seed
```

Isso cria:
- 1 usuário admin: `admin@shopee-viral.com` / `Admin@2024`
- 10 produtos Top 10 com ranking
- 20 produtos adicionais

### 4. Iniciar o servidor

```bash
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## Como acessar o admin

1. Acesse [http://localhost:3000/admin](http://localhost:3000/admin)
2. Você será redirecionado para `/login`
3. Use:
   - **Email:** `admin@shopee-viral.com`
   - **Senha:** `Admin@2024`

### O que fazer no admin:

| Ação | Onde |
|------|------|
| Ver métricas | Dashboard (`/admin`) |
| Criar produto | `/admin/products/new` |
| Editar produto | `/admin/products` → ícone de lápis |
| Adicionar mídias | `/admin/products` → ícone de imagem |
| Ativar/desativar | Clique no badge "Ativo/Inativo" |

---

## Como fazer deploy na Vercel

### 1. Push para GitHub

```bash
git init
git add .
git commit -m "feat: initial shopee viral studio"
git branch -M main
git remote add origin https://github.com/seu-usuario/shopee-viral-studio.git
git push -u origin main
```

### 2. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **Add New → Project**
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Clique em **Deploy**

### 3. Configurar URL no Supabase

Após o deploy, vá em **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://seu-projeto.vercel.app`
- **Redirect URLs:** `https://seu-projeto.vercel.app/**`

---

## Estrutura do projeto

```
shopee-viral-studio/
├── app/
│   ├── page.tsx                          # Home pública
│   ├── login/page.tsx                    # Login admin
│   ├── admin/
│   │   ├── layout.tsx                    # Layout sidebar admin
│   │   ├── page.tsx                      # Dashboard
│   │   └── products/
│   │       ├── page.tsx                  # Lista de produtos
│   │       ├── new/page.tsx              # Criar produto
│   │       └── [id]/
│   │           ├── edit/page.tsx         # Editar produto
│   │           └── media/page.tsx        # Gerenciar mídias
│   └── api/
│       ├── download/[mediaId]/route.ts   # API de download
│       └── admin/logout/route.ts         # Logout
├── components/
│   ├── ui/                               # shadcn/ui components
│   ├── admin/                            # Componentes admin
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCarousel.tsx               # Carrossel Top 10
│   ├── ProductGrid.tsx                   # Grid de produtos
│   └── MediaModal.tsx                    # Modal de mídias
├── lib/
│   ├── supabase.ts                       # Cliente Supabase (browser + server)
│   ├── supabase-admin.ts                 # Cliente com service_role
│   └── utils.ts
├── types/
│   └── database.ts                       # Tipos TypeScript do schema
├── supabase/
│   └── migrations/001_initial.sql        # Schema SQL completo
├── scripts/
│   └── seed.ts                           # Dados iniciais
└── middleware.ts                          # Proteção de rotas /admin
```

---

## Funcionalidades

### Site público
- ✅ Carrossel horizontal com Top 10 produtos virais
- ✅ Badges de ranking (ouro, prata, bronze)
- ✅ Grid responsivo com filtro por categoria
- ✅ Modal de mídias com tabs Fotos/Vídeos
- ✅ Download forçado de fotos e vídeos (funciona mobile + desktop)
- ✅ Contador de downloads por mídia
- ✅ Toast notification pós-download
- ✅ Loading skeletons

### Painel Admin
- ✅ Login seguro com Supabase Auth
- ✅ Dashboard com métricas
- ✅ CRUD completo de produtos
- ✅ Upload de fotos (drag & drop, múltiplos)
- ✅ Upload de vídeos (drag & drop)
- ✅ Barra de progresso de upload
- ✅ Ativar/desativar produtos
- ✅ Gerenciar ranking Top 10
- ✅ Excluir mídias com remoção do Storage

---

## Suporte

Para dúvidas sobre o Supabase, consulte a [documentação oficial](https://supabase.com/docs).
