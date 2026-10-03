const express = require("express");
const router = express.Router();
const BotController = require("../controllers/BotController");
const { isAuthenticated } = require("../middlewares/authMiddleware");
const { hasGuildPermission } = require("../middlewares/guildMiddleware");
const { validateSameOriginOrFetchSite, actionLimiter } = require("../middlewares/securityMiddleware");

// Rota de ícone da guilda
router.get("/obter-icone-guilda/:guildId", isAuthenticated, BotController.getGuildIcon);

// Rota de info geral do Bot (suporta POST vindo do dashboard e GET no reload F5 / acesso direto)
router.post("/botinfo", isAuthenticated, hasGuildPermission, BotController.botInfo);
router.get("/botinfo", isAuthenticated, hasGuildPermission, BotController.botInfo);
router.get("/botinfo/:guildId", isAuthenticated, hasGuildPermission, BotController.botInfo);

// Rota de visualização de painéis
router.get("/pagina/:page/:param2", isAuthenticated, hasGuildPermission, BotController.renderPage);

// Rota de ações de edição de funcoes (Ativação e Desativação) - Protegida contra CSRF e Rate Limited
router.get(
  ["/pagina/funcs/:page/:guildId", "/pagina/funcs/:page/:guildId/:channelin"],
  isAuthenticated,
  hasGuildPermission,
  validateSameOriginOrFetchSite,
  actionLimiter,
  BotController.editFuncs
);
router.post(
  ["/pagina/funcs/:page/:guildId", "/pagina/funcs/:page/:guildId/:channelin"],
  isAuthenticated,
  hasGuildPermission,
  validateSameOriginOrFetchSite,
  actionLimiter,
  BotController.editFuncs
);

// Rota de ações do Database (Adicionar, remover) - Protegida contra CSRF e Rate Limited
router.get(
  "/pagina/dtbase/:page/:guildId/:channelin",
  isAuthenticated,
  hasGuildPermission,
  validateSameOriginOrFetchSite,
  actionLimiter,
  BotController.dbActions
);
router.post(
  ["/pagina/dtbase/:page/:guildId", "/pagina/dtbase/:page/:guildId/:channelin"],
  isAuthenticated,
  hasGuildPermission,
  validateSameOriginOrFetchSite,
  actionLimiter,
  BotController.dbActions
);

// Rota de atualizar economia - Protegida contra CSRF e Rate Limited
router.post(
  "/update-economy",
  isAuthenticated,
  hasGuildPermission,
  validateSameOriginOrFetchSite,
  actionLimiter,
  BotController.updateEconomy
);

module.exports = router;
