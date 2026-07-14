const express = require("express");
const router = express.Router();
const BotController = require("../controllers/BotController");
const { isAuthenticated } = require("../middlewares/authMiddleware");
const { hasGuildPermission } = require("../middlewares/guildMiddleware");

// Rota de ícone da guilda
router.get("/obter-icone-guilda/:guildId", isAuthenticated, BotController.getGuildIcon);

// Rota de info geral do Bot 
router.post("/botinfo", isAuthenticated, hasGuildPermission, BotController.botInfo);

// Rota de visualização de painéis
router.get("/pagina/:page/:param2", isAuthenticated, hasGuildPermission, BotController.renderPage);

// Rota de ações de edição de funcoes (Ativação e Desativação)
router.get("/pagina/funcs/:page/:guildId/:channelin", isAuthenticated, hasGuildPermission, BotController.editFuncs);

// Rota de ações do Database (Adicionar, remover)
router.get("/pagina/dtbase/:page/:guildId/:channelin", isAuthenticated, hasGuildPermission, BotController.dbActions);

// Rota de atualizar economia
router.post("/update-economy", isAuthenticated, hasGuildPermission, BotController.updateEconomy);

module.exports = router;
