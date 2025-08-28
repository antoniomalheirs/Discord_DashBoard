# Dashboard Web para Bot do Discord

![Node.js](https://img.shields.io/badge/Node.js-22.x+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.1.x-000000?style=for-the-badge&logo=express&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-3.1.10-A91E50?style=for-the-badge&logo=javascript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Uma interface web completa para gerenciar e configurar seu bot do Discord diretamente pelo navegador. Permite que administradores de servidores configurem funcionalidades como notificações, visualizem estatísticas e muito mais, sem a necessidade de usar comandos de texto.

## ✨ Índice

- [📹 Demonstração](#-demonstração)
- [🚀 Funcionalidades](#-funcionalidades)
- [💻 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [📋 Pré-requisitos](#-pré-requisitos)
- [⚙️ Instalação e Configuração](#️-instalação-e-configuração)
- [▶️ Executando o Projeto](#️-executando-o-projeto)
- [🤝 Como Contribuir](#-como-contribuir)
- [📝 Licença](#-licença)

---

## 📹 Demonstração

Veja abaixo um vídeo demonstrando a interface e as funcionalidades do projeto:

https://github.com/antoniomalheirs/Discord_DashBoard/assets/79883711/b956e75c-92fa-4d3b-8973-f83dddecfb6b

## 🚀 Funcionalidades

- **Autenticação Segura:** Login integrado com a API do Discord usando Passport.js e OAuth2.
- **Gerenciamento de Servidores:** O usuário pode selecionar para qual servidor deseja aplicar as configurações.
- **Configuração do Bot:** Interface visual para ativar/desativar módulos e configurar canais de notificação (YouTube, Twitch, etc.).
- **Visualização de Estatísticas:** Exibição de dados e estatísticas dos membros do servidor.
- **Design Responsivo:** Interface amigável para desktops e dispositivos móveis, construída com Tailwind CSS.

## 💻 Tecnologias Utilizadas

#### **Backend**
- **[Node.js](https://nodejs.org/)**: Ambiente de execução JavaScript.
- **[Express.js](https://expressjs.com/)**: Framework para construção do servidor web.
- **[MongoDB](https://www.mongodb.com/)**: Banco de dados NoSQL para armazenar as configurações.
- **[Mongoose](https://mongoosejs.com/)**: ODM para modelagem dos dados do MongoDB.
- **[Passport.js](http://www.passportjs.org/)**: Middleware para autenticação de usuários (com estratégia para Discord).
- **[Express Session](https://www.npmjs.com/package/express-session)**: Para gerenciamento de sessões de usuário.

#### **Frontend**
- **[EJS (Embedded JavaScript)](https://ejs.co/)**: Template engine para renderizar páginas HTML dinâmicas.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework de CSS utility-first para estilização.

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você possui:

- [Node.js](https://nodejs.org/) (versão 16.9.0 ou superior) e NPM.
- Uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (ou uma instância local do MongoDB).
- Um **Aplicativo Discord** criado no [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications).
- **O seu projeto de Bot do Discord**, já que este dashboard serve para controlá-lo.

> **Importante:** No seu aplicativo no Portal de Desenvolvedores do Discord, vá para a seção **"OAuth2" -> "General"** e adicione uma **Redirect URI**. Para o ambiente de desenvolvimento local, adicione: `http://localhost:3000/auth/discord/callback`

## ⚙️ Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente.

**1. Clone o repositório:**
```bash
git clone [https://github.com/antoniomalheirs/Discord_DashBoard.git](https://github.com/antoniomalheirs/Discord_DashBoard.git)
cd Discord_DashBoard
```
**2. Instale as dependências:**
Este comando instalará todos os pacotes listados no arquivo `package.json`.
```bash
npm install
```
**3. Configure as variáveis de ambiente:**
Crie um arquivo chamado .env na raiz do projeto. Preencha com as suas credenciais, seguindo o exemplo abaixo:
```bash
# Credenciais do seu Aplicativo no Discord
DISCORD_CLIENT_ID=SEU_CLIENT_ID_AQUI
DISCORD_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
DISCORD_BOT_TOKEN=O_TOKEN_DO_SEU_BOT_AQUI

# URL de Callback (a mesma que você configurou no portal do Discord)
CALLBACK_URL=http://localhost:3000/auth/discord/callback

# Banco de Dados MongoDB
MONGODB_URI=SUA_URI_DE_CONEXAO_DO_MONGODB_AQUI

# Chave secreta para a sessão de usuário (pode ser qualquer string aleatória)
SESSION_SECRET=COLOQUE_UMA_STRING_SECRETA_E_ALEATORIA_AQUI

# Porta em que o servidor irá rodar
PORT=3000
```
- `DISCORD_TOKEN`: Encontrado no seu aplicativo no [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications), na seção "Bot".
- `MONGODB_URI`: Obtida ao criar um cluster no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- `YOUTUBE_API_KEY`: Gerada no [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`: Obtidos ao registrar uma nova aplicação no [Console de Desenvolvedores da Twitch](https://dev.twitch.tv/console/apps).

## ▶️ Executando o Projeto
Após a instalação e configuração, execute o seguinte comando no diretório raiz do projeto (onde está o package.json):
```bash
node src/index.js
```
Ou, caso tenha configurado o main no seu package.json:
```bash
node .
```
Seu site estará disponível em http://localhost:3000.
- Dica de Desenvolvimento: Use o nodemon para que o servidor reinicie automaticamente a cada alteração no código. Para isso, instale-o (npm install -g nodemon) e rode com nodemon src/index.js.
  
## 🤝 Como Contribuir
Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será muito apreciada.

 1º Faça um Fork do projeto.

 2º Crie uma nova Branch (git checkout -b feature/sua-feature-incrivel).

 3º Faça o Commit de suas alterações (git commit -m 'Adiciona sua-feature-incrivel').

 4º Faça o Push para a Branch (git push origin feature/sua-feature-incrivel).

 5º Abra um Pull Request.

## 📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
