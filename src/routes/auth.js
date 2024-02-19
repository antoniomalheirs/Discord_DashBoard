const express = require("express");
const passport = require("passport");
const router = express.Router();
require("dotenv").config();

router.get("/discord", passport.authenticate("discord"));

router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

router.get("/about", (req, res) => {
  res.render("aboutpage.ejs");
});

router.get("/docs", (req, res) => {
  res.render("docspage.ejs");
});

router.get("/devs", (req, res) => {
  res.render("devspage.ejs");
});

router.get("/funcutils", (req, res) => {
  res.render("funcutilspage.ejs");
});

router.get("/", (req, res) => {
  res.render("home.ejs");
});

module.exports = router;
