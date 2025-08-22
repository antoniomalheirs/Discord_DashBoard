const express = require("express");
const passport = require("passport");
const router = express.Router();
require("dotenv").config();

// =========================
// 🔑 Rotas de Autenticação
// =========================

// Inicia login com Discord
router.get("/discord", passport.authenticate("discord"));

// Callback do Discord (definido também no Dev Portal do Discord)
router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    // Se chegou até aqui, o login foi bem-sucedido
    res.redirect("/dashboard");
  }
);

// Logout do usuário
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// =========================
// 📄 Páginas públicas
// =========================
router.get("/", (req, res) => res.render("home.ejs"));
router.get("/about", (req, res) => res.render("aboutpage.ejs"));
router.get("/docs", (req, res) => res.render("docspage.ejs"));
router.get("/devs", (req, res) => res.render("devspage.ejs"));
router.get("/funcutils", (req, res) => res.render("funcutilspage.ejs"));

// =========================
// 👤 Dashboard (apenas logado)
// =========================
router.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("dashboard.ejs", { user: req.user });
});

module.exports = router;
