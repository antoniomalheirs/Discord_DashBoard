const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStoreModule = require("connect-mongo");
const MongoStore = MongoStoreModule.default || MongoStoreModule.MongoStore || MongoStoreModule;
const passport = require("passport");
const { Strategy: DiscordStrategy } = require("passport-discord");
const refresh = require("passport-oauth2-refresh");
const helmet = require("helmet");
const mongoose = require("mongoose");

const config = require("./config/env");
const authRoutes = require("./routes/auth");
const botRoutes = require("./routes/botRoutes");
const AuthController = require("./controllers/AuthController");
const { globalLimiter, csrfProtection } = require("./middlewares/securityMiddleware");
const { encrypt } = require("./utils/tokenEncryption");
const discordBot = require("./Client");
const UsersAPIRepository = require("./database/mongoose/UsersAPIRepository");
const UserAPISchema = require("./database/schemas/UserAPISchema");

if (!mongoose.models["APIUsers"]) {
  mongoose.model("APIUsers", UserAPISchema);
}

// Passport serialization — armazena dados essenciais da sessão com auto-recuperação de avatar
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    email: user.email || "",
    guilds: user.guilds || [],
  });
});

passport.deserializeUser(async (obj, done) => {
  if (obj && !obj.avatar && discordBot?.users) {
    try {
      const discordUser = discordBot.users.cache.get(obj.id) || await discordBot.users.fetch(obj.id).catch(() => null);
      if (discordUser && discordUser.avatar) {
        obj.avatar = discordUser.avatar;
      }
    } catch (e) {}
  }
  done(null, obj);
});

// Initialize Discord bot client
(async () => {
  try {
    await discordBot.start();
    console.log("[BOT] DASHBOARD UPLINKED!");
  } catch (error) {
    console.error("[BOT] DASHBOARD FAIL!", error);
  }
})();

const app = express();
app.disable("x-powered-by");

// Request logging in development
if (!config.isProduction && process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
  });
}

// Body parsing middleware (native Express 5) — com limite de payload
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static assets com cache seguro
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: config.isProduction ? "7d" : 0,
  etag: true,
}));

// Security headers (OWASP Hardening & Content Security Policy Harmonizado)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://code.jquery.com",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "data:",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://cdn.discordapp.com",
          "https://i.ytimg.com",
          "https://static-cdn.jtvnw.net",
          "https://*.twitch.tv",
          "https://images.unsplash.com",
        ],
        connectSrc: [
          "'self'",
          "https://discord.com",
          "https://api.twitch.tv",
          "https://id.twitch.tv",
        ],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", "https://discord.com"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting global
app.use(globalLimiter);

// Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
});

// Session configuration com MongoStore persistente
app.set("trust proxy", 1);
app.use(
  session({
    secret: config.secretKey,
    name: "ManagerBot.sid",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.mongoUri,
      ttl: 86400,
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Proteção Anti-CSRF para todas as requisições autenticadas e rotas com estado
app.use(csrfProtection);

// Discord OAuth2 Strategy
const discordStrategy = new DiscordStrategy(
  {
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackUrl,
    scope: ["identify", "guilds"],
    state: true,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userRepo = new UsersAPIRepository(mongoose, "APIUsers");
      const existingUser = await userRepo.findOne(profile.id);

      const userData = {
        codigouser: profile.id,
        username: profile.username,
        acesstk: encrypt(accessToken),
        refreshtk: encrypt(refreshToken),
      };

      if (!existingUser) {
        await userRepo.add(userData);
      } else {
        await userRepo.update(profile.id, userData);
      }

      return done(null, profile);
    } catch (err) {
      console.error("[AUTH ERROR] Error saving user to database:", err);
      return done(err, null);
    }
  }
);

passport.use(discordStrategy);
refresh.use(discordStrategy);

// Feature & authentication routes
app.use("/auth", authRoutes);
app.use("/bot", botRoutes);

// Root & informational routes
app.get("/", AuthController.renderHome);
app.get("/about", AuthController.renderAbout);
app.get("/docs", AuthController.renderDocs);
app.get("/devs", AuthController.renderDevs);
app.get("/funcutils", AuthController.renderFuncUtils);
app.get("/dashboard", AuthController.renderDashboard);

// 404 Handler - Captura rotas inexistentes
app.use((req, res, next) => {
  if (req.xhr || req.headers["accept"]?.includes("application/json") || req.headers["x-requested-with"] === "XMLHttpRequest") {
    return res.status(404).json({ success: false, message: "Recurso ou rota não encontrada." });
  }
  res.status(404).render("error.ejs", {
    error: "A página ou recurso que você tentou acessar não existe ou foi movido.",
  });
});

// Global Error Handler (Sanitizado para prevenir vazamento de dados internos)
app.use((err, req, res, next) => {
  console.error("[SECURITY] Unhandled Exception:", err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  const isClientSafe = statusCode < 500 && err.message;
  res.status(statusCode).render("error.ejs", {
    error: isClientSafe ? err.message : "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.",
  });
});

// Start Server
const server = app.listen(config.port, () => {
  const envLabel = config.isProduction ? "PRODUÇÃO" : "DESENVOLVIMENTO";
  console.log(`[SERVER] Servidor rodando em modo ${envLabel} na porta ${config.port}`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n[SERVER] Sinal ${signal} recebido. Encerrando conexões com segurança...`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
      console.log("[DATABASE] Conexão com MongoDB encerrada com sucesso.");
      if (discordBot.destroy) {
        discordBot.destroy();
        console.log("[BOT] Cliente Discord desconectado.");
      }
      process.exit(0);
    } catch (err) {
      console.error("[SERVER] Erro durante o encerramento:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
