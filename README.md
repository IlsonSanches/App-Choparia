# App Choparia - Sistema de Controle de Vendas

Sistema web moderno para controle de vendas de uma choparia, com múltiplas formas de pagamento e dashboard completo.

## 🚀 Funcionalidades

- **Dashboard** com resumo de vendas (hoje, semana, mês)
- **Registro de vendas** com 8 formas de pagamento:
  - Dinheiro
  - Débito Inter
  - Débito Stone
  - Crédito Inter
  - Crédito Stone
  - iFood PG
  - Pix Inter
  - Pix Stone
- **Histórico de vendas** com filtros e exportação para CSV
- **Interface responsiva** para desktop e mobile
- **Armazenamento em tempo real** com Firebase

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Banco de Dados**: Firebase Firestore
- **Ícones**: Lucide React
- **Notificações**: React Hot Toast
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

No Firebase Console, vá em Firestore Database → Regras e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita na coleção 'vendas'
    match /vendas/{document} {
      allow read, write: if true;
    }
  }
}
```

## 🚀 Executar o projeto

```bash
# Executar em modo desenvolvimento
npm run dev

# O app estará disponível em http://localhost:3000
```

## 📱 Como usar

### Registrar uma venda
1. Clique em "Nova Venda" no menu lateral
2. Preencha os valores por forma de pagamento
3. Adicione observações se necessário
4. Clique em "Registrar Venda"

### Visualizar dashboard
1. Clique em "Dashboard" no menu lateral
2. Veja resumos de hoje, semana e mês
3. Analise vendas por forma de pagamento

### Consultar histórico
1. Clique em "Histórico" no menu lateral
2. Use filtros por data, forma de pagamento ou busca
3. Exporte dados para CSV
4. Visualize detalhes clicando no ícone de olho

## 🏗️ Estrutura do projeto

```
src/
├── components/
│   ├── Dashboard.jsx      # Dashboard principal
│   ├── SalesForm.jsx      # Formulário de vendas
│   ├── SalesHistory.jsx   # Histórico de vendas
│   └── Sidebar.jsx        # Menu lateral
├── config/
│   └── firebase.js        # Configuração Firebase
├── App.jsx               # Componente principal
├── main.jsx             # Ponto de entrada
└── index.css            # Estilos globais
```

## 📊 Estrutura dos dados

### Coleção 'vendas' no Firestore:
```javascript
{
  dinheiro: "0.00",
  debitoInter: "0.00",
  debitoStone: "0.00", 
  creditoInter: "0.00",
  creditoStone: "0.00",
  ifoodPG: "0.00",
  pixInter: "0.00",
  pixStone: "0.00",
  total: "0.00",
  observacoes: "string",
  dataVenda: timestamp,
  timestamp: number
}
```

## 🎨 Personalização

### Cores (tailwind.config.js)
- `primary`: Cor principal do menu (#1f2937)
- `secondary`: Cor secundária (#374151)
- `accent`: Cor de destaque (#3b82f6)

### Formas de pagamento
Para adicionar/remover formas de pagamento, edite o array `paymentMethods` nos componentes.

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
