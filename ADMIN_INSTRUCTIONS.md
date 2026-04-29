# 🎯 Sistema Administrativo - Sadock FC

## 📋 Visão Geral

O site do Sadock FC agora possui um **sistema completo de gerenciamento administrativo** que permite que usuários autenticados façam alterações em tempo real em:

- ⚽ **Jogadores** (adicionar, editar, remover, upload de fotos)
- 🏆 **Partidas** (adicionar, editar, remover, upload de logos dos adversários)
- 🛍️ **Loja** (gerenciar produtos)
- 🤝 **Patrocinadores** (gerenciar empresas parceiras)

## 🔐 Como Acessar

### 1. Criar uma Conta
1. Acesse a página `/login` no site
2. Clique em **"Não tem conta? Crie uma"**
3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
4. Clique em **"Criar Conta"**
5. Você será automaticamente redirecionado para o painel admin

### 2. Fazer Login
1. Acesse `/login`
2. Digite seu email e senha
3. Clique em **"Entrar"**
4. Você será redirecionado para `/admin`

### 3. Botão na Navbar
- Quando **logado**: aparece botão **"ADMIN"** na navbar (ícone de engrenagem)
- Quando **deslogado**: aparece botão **"LOGIN"**

## 🎮 Funcionalidades do Painel Admin

### ⚽ Gerenciar Jogadores

#### Adicionar Novo Jogador
1. Na aba **"Jogadores"**, clique em **"+ Novo Jogador"**
2. Preencha os dados:
   - **Nome**: Nome completo do jogador
   - **Posição**: Selecione (Goleiro, Fixo, Ala, Meio, Pivô, Técnico)
   - **Número**: Número da camisa
   - **Instagram**: Username (sem @)
   - **Aniversário**: Formato DD/MM/AAAA
   - **Foto de Perfil**: Faça upload de uma imagem
   - **Estatísticas**: Por temporada (2024, 2025, 2026)
     - Jogos, Gols, Assistências, MVP
3. Clique em **"Salvar"**

#### Editar Jogador
1. Na lista de jogadores, clique no botão **"Editar"** (ícone de lápis)
2. Modifique os campos desejados
3. Clique em **"Salvar"**

#### Remover Jogador
1. Clique no botão **"Remover"** (ícone de lixeira - vermelho)
2. Confirme a remoção

#### Upload de Fotos
- As fotos são armazenadas no **Supabase Storage**
- Tamanho recomendado: 500x500px
- Formatos aceitos: JPG, PNG
- As URLs são geradas automaticamente e válidas por 1 ano

---

### 🏆 Gerenciar Partidas

#### Adicionar Nova Partida
1. Na aba **"Partidas"**, clique em **"+ Nova Partida"**
2. Preencha:
   - **Data**: DD/MM/AAAA
   - **Adversário**: Nome do time adversário
   - **Gols Sadock FC**: Número de gols marcados
   - **Gols Adversário**: Número de gols sofridos
   - **Local**: Nome do local/campo
   - **Competição**: Nome do campeonato
   - **Logo Adversário**: Upload da logo do time adversário
3. Clique em **"Salvar"**

#### Editar/Remover Partida
- Funciona da mesma forma que jogadores

---

### 🛍️ Gerenciar Loja

#### Adicionar Item
1. Na aba **"Loja"**, clique em **"+ Novo Item"**
2. Preencha:
   - **Nome**: Nome do produto
   - **Preço**: Valor em R$
   - **Estoque**: Quantidade disponível
   - **Descrição**: Texto descritivo
   - **URL da Imagem**: Link da imagem do produto
3. Clique em **"Salvar"**

#### Editar/Remover Item
- Mesma lógica das outras seções

---

### 🤝 Gerenciar Patrocinadores

#### Adicionar Patrocinador
1. Na aba **"Patrocinadores"**, clique em **"+ Novo Patrocinador"**
2. Preencha:
   - **Nome**: Nome da empresa
   - **Website**: URL do site
   - **URL do Logo**: Link da logo
3. Clique em **"Salvar"**

---

## 🔒 Segurança

### Autenticação
- Sistema usa **Supabase Auth**
- Senhas são criptografadas
- Tokens JWT para sessões seguras
- Email confirmado automaticamente (servidor de email não configurado)

### Autorização
- Todas as operações de **criação/edição/remoção** requerem autenticação
- Token de acesso é enviado em cada requisição
- Middleware no backend valida o token antes de processar

### Armazenamento
- **Dados**: Salvos no KV Store do Supabase
- **Imagens**: Armazenadas em buckets privados do Supabase Storage
- **URLs**: Assinadas e válidas por 1 ano

---

## 🚀 Integração Frontend ↔️ Backend

### Como os Dados São Salvos

Quando você adiciona/edita algo no painel admin:

1. **Frontend** envia requisição para o servidor Supabase
2. **Servidor** valida o token de autenticação
3. **Backend** salva os dados no KV Store
4. **Frontend** recarrega os dados atualizados
5. **Site público** exibe as alterações em tempo real

### Sincronização com Dados Estáticos

⚠️ **IMPORTANTE**: 
- Os dados **ainda estão nos arquivos estáticos** (`/src/app/data/players.ts` e `/src/app/data/matches.ts`)
- Para integrar completamente, você precisa:
  1. **Migrar dados iniciais** para o banco de dados
  2. **Atualizar componentes** para buscar do banco ao invés dos arquivos
  
📝 **Próximos Passos Recomendados**:
- Criar um script de migração para popular o KV Store com os dados atuais
- Modificar páginas (Home, Elenco, Partidas) para buscar do backend
- Implementar cache e loading states

---

## 🛠️ Estrutura de Arquivos

```
/src/app/
├── contexts/
│   └── AuthContext.tsx          # Gerencia estado de autenticação
├── pages/
│   ├── Login.tsx                # Página de login/cadastro
│   ├── Admin.tsx                # Painel administrativo completo
│   ├── Home.tsx
│   ├── Elenco.tsx
│   └── ...
├── components/
│   └── Navbar.tsx               # Atualizada com botão admin
└── data/
    ├── players.ts               # Dados estáticos (a migrar)
    └── matches.ts               # Dados estáticos (a migrar)

/supabase/functions/server/
└── index.tsx                    # API backend com todas as rotas
```

---

## 📡 Rotas da API

### Autenticação
- `POST /make-server-039eccc6/auth/signup` - Criar conta

### Jogadores
- `GET /make-server-039eccc6/players` - Listar todos
- `POST /make-server-039eccc6/players` - Criar (requer auth)
- `PUT /make-server-039eccc6/players/:id` - Editar (requer auth)
- `DELETE /make-server-039eccc6/players/:id` - Remover (requer auth)
- `POST /make-server-039eccc6/upload/player-photo` - Upload foto (requer auth)

### Partidas
- `GET /make-server-039eccc6/matches` - Listar todas
- `POST /make-server-039eccc6/matches` - Criar (requer auth)
- `PUT /make-server-039eccc6/matches/:id` - Editar (requer auth)
- `DELETE /make-server-039eccc6/matches/:id` - Remover (requer auth)
- `POST /make-server-039eccc6/upload/team-logo` - Upload logo (requer auth)

### Loja
- `GET /make-server-039eccc6/shop` - Listar itens
- `POST /make-server-039eccc6/shop` - Criar (requer auth)
- `PUT /make-server-039eccc6/shop/:id` - Editar (requer auth)
- `DELETE /make-server-039eccc6/shop/:id` - Remover (requer auth)

### Patrocinadores
- `GET /make-server-039eccc6/sponsors` - Listar
- `POST /make-server-039eccc6/sponsors` - Criar (requer auth)
- `PUT /make-server-039eccc6/sponsors/:id` - Editar (requer auth)
- `DELETE /make-server-039eccc6/sponsors/:id` - Remover (requer auth)

---

## ⚠️ Avisos Importantes

### Dados Sensíveis
- **NÃO armazene informações pessoais identificáveis (PII) sensíveis**
- Use apenas para dados relacionados ao clube esportivo
- Figma Make não é destinado a proteger dados sensíveis

### Limitações
- Email de confirmação automático (servidor SMTP não configurado)
- Buckets de armazenamento criados automaticamente no primeiro deploy
- URLs de imagens assinadas válidas por 1 ano (precisam ser renovadas)

### Boas Práticas
- Faça logout ao sair de computadores compartilhados
- Use senhas fortes (mínimo 6 caracteres)
- Confirme antes de remover jogadores/partidas

---

## 🎨 Personalização

### Estilos
- Design dark/gold premium mantido
- Componentes shadcn/ui para consistência
- Animações Motion para suavidade

### Posições Disponíveis
```typescript
const POSITIONS = ['Goleiro', 'Fixo', 'Ala', 'Meio', 'Pivô', 'Técnico'];
```

Para adicionar novas posições, edite a constante em `/src/app/pages/Admin.tsx`

---

## 🐛 Troubleshooting

### Erro ao fazer upload de foto
- Verifique o tamanho do arquivo (máx 5MB recomendado)
- Confirme o formato (JPG, PNG)
- Veja o console do navegador para erros

### Não consegue fazer login
- Verifique se o email está correto
- Senha deve ter no mínimo 6 caracteres
- Limpe o cache do navegador

### Alterações não aparecem no site
- Os dados ainda precisam ser integrados do KV Store para os componentes
- Atualmente, o site exibe dados estáticos dos arquivos `.ts`

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console (F12)
2. Confira a aba Network para erros de API
3. Revise este documento

---

**Desenvolvido com ⚽ para o Sadock FC**
