const passport = require("passport");
const config = require("../config/env");

class AuthController {
  constructor() {
    this.login = this.login.bind(this);
    this.callback = this.callback.bind(this);
    this.getCallbackURL = this.getCallbackURL.bind(this);
  }

  getCallbackURL(req) {
    const host = req.get("host");
    if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10."))) {
      return `${req.protocol}://${host}/auth/discord/callback`;
    }
    return config.callbackUrl;
  }

  // Inicializa o login dinamicamente pelo host da requisição
  login(req, res, next) {
    const callbackURL = this.getCallbackURL(req);
    passport.authenticate("discord", { callbackURL })(req, res, next);
  }

  // Callback após login
  callback(req, res, next) {
    const callbackURL = this.getCallbackURL(req);
    passport.authenticate("discord", { callbackURL, failureRedirect: "/" })(req, res, () => {
      res.redirect("/dashboard");
    });
  }

  // Realiza logout seguro destruindo a sessão e limpando o cookie
  logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      if (req.session) {
        req.session.destroy((sessionErr) => {
          if (sessionErr) console.error("[AUTH] Erro ao destruir sessão:", sessionErr);
          res.clearCookie("ManagerBot.sid", { path: "/" });
          return res.redirect("/");
        });
      } else {
        res.clearCookie("ManagerBot.sid", { path: "/" });
        return res.redirect("/");
      }
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
