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

module.exports = router;
