const passport = require("passport");

class AuthController {
  // Inicializa o login
  login(req, res, next) {
    passport.authenticate("discord")(req, res, next);
  }

  // Callback após login
  callback(req, res, next) {
    passport.authenticate("discord", { failureRedirect: "/" })(req, res, () => {
      res.redirect("/dashboard");
    });
  }

  // Realiza logout
  logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  }

  // Páginas públicas
  renderHome(req, res) {
    res.render("home.ejs");
  }

  renderAbout(req, res) {
    res.render("aboutpage.ejs");
  }

  renderDocs(req, res) {
    res.render("docspage.ejs");
  }

  renderDevs(req, res) {
    res.render("devspage.ejs");
  }

  renderFuncUtils(req, res) {
    res.render("funcutilspage.ejs");
  }

  // Dashboard logada
  renderDashboard(req, res) {
    // Redirecionamento movido para middleware ou feito direto aqui
    if (!req.isAuthenticated()) {
      return res.redirect("/");
    }
    res.render("dashboard.ejs", { user: req.user });
  }
}

module.exports = new AuthController();
