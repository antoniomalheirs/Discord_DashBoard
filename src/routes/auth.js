const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

// =========================
// 🔑 Rotas de Autenticação
// =========================
router.get("/discord", AuthController.login);
router.get("/discord/callback", AuthController.callback);
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

