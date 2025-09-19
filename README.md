# App Choparia - Sistema de Controle de Vendas

Sistema web moderno para controle de vendas de uma choparia, com múltiplas formas de pagamento e dashboard completo.

## 🚀 Funcionalidades

- **Dashboard** com resumo de vendas (hoje, semana, mês)
- **Quadro de estimativa mensal** baseado na média diária do mês atual
- **Registro de vendas** com 8 formas de pagamento:
  - Dinheiro
  - Débito Inter
  - Débito Stone
  - Crédito Inter
  - Crédito Stone
  - iFood PG
  - PIX Inter
  - PIX Stone
- **Campos informativos** (não somam no total):
  - Vendas Mesas
  - Vendas Entregas
  - Incentivo iFood
  - iFood Desconto
  - iFood Venda
- **Ajustes de caixa** (Encaixe e Desencaixe)
- **Conferência automática** de valores
- **Histórico de vendas** com filtros e exportação para CSV
- **Sistema de autenticação** com roles (admin/user)
- **Gerenciamento de usuários** (apenas admins)
- **Interface responsiva** para desktop e mobile
- **Armazenamento em tempo real** com Firebase

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Ícones**: Lucide React
- **Notificações**: React Hot Toast
- **Gráficos**: Recharts
- **Data**: date-fns

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Conta no Firebase (gratuita)

## 🔧 Instalação

### 1. Clone e instale dependências

```bash
# Navegar para o diretório do projeto
cd App-Choparia

# Instalar dependências
npm install
```

### 2. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o Firestore Database
4. No menu lateral, vá em "Configurações do projeto" → "Geral"
5. Role para baixo até "Seus apps" e clique em "Web"
6. Registre o app e copie a configuração

### 3. Configurar variáveis do Firebase

Edite o arquivo `src/config/firebase.js` e substitua as configurações:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### 4. Configurar regras do Firestore

No Firebase Console, vá em Firestore Database → Regras e confi

```

## 🚀 Executar o projeto

```bash
# Executar em modo desenvolvimento
npm run dev

# O app estará disponível em http://localhost:3000
```

## 📱 Como usar

### Primeiro acesso
1. Acesse o sistema pela primeira vez
2. Crie o primeiro administrador
3. Faça login com as credenciais criadas

### Registrar uma venda
1. Clique em "Nova Venda" no menu lateral
2. Preencha os valores por forma de pagamento
3. Adicione valores informativos (Vendas Mesas, Entregas, iFood)
4. Configure ajustes de caixa se necessário
5. Adicione observações se necessário
6. Clique em "Registrar Venda"

### Visualizar dashboard
1. Clique em "Dashboard" no menu lateral
2. Veja resumos de hoje, semana e mês
3. Analise vendas por forma de pagamento
4. Consulte a estimativa mensal de vendas Sagres
5. Acompanhe o progresso do mês atual

### Consultar histórico
1. Clique em "Histórico" no menu lateral
2. Use filtros por data, forma de pagamento ou busca
3. Edite vendas existentes clicando no ícone de lápis
4. Exporte dados para CSV
5. Visualize detalhes clicando no ícone de olho

### Gerenciar usuários (apenas admins)
1. Clique em "Usuários" no menu lateral
2. Adicione novos usuários
3. Defina permissões (admin/user)
4. Edite ou remova usuários existentes

## 🏗️ Estrutura do projeto

```
src/
├── components/
│   ├── Dashboard.jsx         # Dashboard principal
│   ├── SalesForm.jsx         # Formulário de vendas
│   ├── SalesHistory.jsx      # Histórico de vendas
│   ├── Sidebar.jsx           # Menu lateral
│   ├── Login.jsx             # Tela de login
│   ├── FirstAdminSetup.jsx   # Setup inicial do admin
│   └── UserManagement.jsx    # Gerenciamento de usuários
├── contexts/
│   └── AuthContext.jsx       # Contexto de autenticação
├── config/
│   └── firebase.js           # Configuração Firebase
├── utils/
│   ├── createFirstAdmin.js   # Utilitário para criar admin
│   └── fixAdminRole.js       # Utilitário para corrigir roles
├── App.jsx                   # Componente principal
├── main.jsx                  # Ponto de entrada
└── index.css                 # Estilos globais
```

## 📊 Estrutura dos dados

### Coleção 'vendas' no Firestore:
```javascript
{
  // Formas de pagamento (somam no total)
  dinheiro: "0.00",
  debitoInter: "0.00",
  debitoStone: "0.00", 
  creditoInter: "0.00",
  creditoStone: "0.00",
  ifoodPG: "0.00",
  pixInter: "0.00",
  pixStone: "0.00",
  
  // Campos informativos (não somam no total)
  vendasMesas: "0.00",
  vendasEntregas: "0.00",
  incentivoIfood: "0.00",
  ifoodDesconto: "0.00",
  ifoodVenda: "0.00",
  
  // Ajustes de caixa
  encaixe: "0.00",
  desencaixe: "0.00",
  
  // Totais calculados
  subtotal: "0.00",
  total: "0.00",
  totalSagres: "0.00",
  
  // Metadados
  observacoes: "string",
  dataVenda: timestamp,
  timestamp: number
}
```

### Coleção 'usuarios' no Firestore:
```javascript
{
  uid: "string",
  name: "string",
  email: "string",
  role: "admin" | "user",
  active: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🎨 Personalização

### Cores (tailwind.config.js)
- `primary`: Cor principal do menu (#1f2937)
- `secondary`: Cor secundária (#374151)
- `accent`: Cor de destaque (#3b82f6)

### Formas de pagamento
Para adicionar/remover formas de pagamento, edite o array `paymentMethods` nos componentes.

### Campos informativos
Para adicionar/remover campos informativos, edite o array `nonSumPayments` no SalesForm.jsx.

## 🆕 Funcionalidades Implementadas

### v1.1.0 - Atualizações Recentes
- ✅ **Campo iFood Venda** adicionado como campo informativo
- ✅ **Quadro de estimativa mensal** no Dashboard
- ✅ **Sistema de autenticação** completo com roles
- ✅ **Gerenciamento de usuários** para administradores
- ✅ **Ajustes de caixa** (Encaixe/Desencaixe)
- ✅ **Conferência automática** de valores
- ✅ **8 formas de pagamento** completas
- ✅ **5 campos informativos** para controle detalhado

## 🚀 Deploy

### Netlify
1. Faça build do projeto: `npm run build`
2. Conecte o repositório no Netlify
3. Configure as variáveis de ambiente do Firebase

### Vercel
1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o Firebase está configurado corretamente
2. Confira as regras do Firestore
3. Verifique o console do navegador para erros

## 📄 Licença

Este projeto está sob a licença MIT.
