const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { authLimiter } = require("../middlewares/securityMiddleware");

// =========================
// 🔑 Rotas de Autenticação
// =========================
router.get("/discord", authLimiter, AuthController.login);
router.get("/discord/callback", authLimiter, AuthController.callback);
router.get("/logout", AuthController.logout);

// =========================
// 📄 Páginas públicas
// =========================
router.get("/", AuthController.renderHome);
router.get("/about", AuthController.renderAbout);
router.get("/docs", AuthController.renderDocs);
router.get("/devs", AuthController.renderDevs);
router.get("/funcutils", AuthController.renderFuncUtils);

// =========================
// 👤 Dashboard
// =========================
router.get("/dashboard", AuthController.renderDashboard);

module.exports = router;

