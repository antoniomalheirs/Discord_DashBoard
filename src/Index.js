const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy, refresh = require("passport-oauth2-refresh");
const authRoutes = require("./routes/auth");
const botRoutes = require("./routes/botRoutes");
const AuthController = require("./controllers/AuthController");
const discordBot = require("./Client");
const mongoose = require("mongoose");
const UsersAPIRepository = require("../src/database/mongoose/UsersAPIRepository");
const UserAPISchema = require("../src/database/schemas/UserAPISchema");
if (!mongoose.models["APIUsers"]) mongoose.model("APIUsers", UserAPISchema);
const bodyParser = require("body-parser");
const http = require("http");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

(async () => {
  try {
    await discordBot.start();
    console.log("DASHBOARD UPLINKED!");
  } catch (error) {
    console.error("DASHBOARD FAIL!", error);
  }
})();

const app = express();
app.disable("x-powered-by");

// Debug logging
app.use((req, res, next) => {
  console.log(`[DEBUG] Request: ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/css"));
app.use(express.static(__dirname + "/public/res/sidebar"));

app.use(helmet({
  contentSecurityPolicy: false, 
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições deste IP, por favor tente novamente mais tarde."
});
app.use(limiter);

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    name: "ManagerBot",
    resave: false, 
    saveUninitialized: false, 
    cookie: {
      httpOnly: true, 
      secure: process.env.AMBIENT === 'production', 
      sameSite: 'lax', 
      maxAge: 3600000 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/bot", botRoutes);

// Rotas raiz direcionadas para o AuthController
app.get("/", AuthController.renderHome);
app.get("/about", AuthController.renderAbout);
app.get("/docs", AuthController.renderDocs);
app.get("/devs", AuthController.renderDevs);
app.get("/funcutils", AuthController.renderFuncUtils);
app.get("/dashboard", AuthController.renderDashboard);

var disc = new DiscordStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ["identify", "email", "guilds"],
  },
  async (accessToken, refreshToken, profile, log) => {
    const userapischema = new UsersAPIRepository(mongoose, "APIUsers");
    const user = await userapischema.findOne(profile.id);

    if (!user) {
      const newUser = {
        codigouser: profile.id,
        username: profile.username,
        acesstk: accessToken,
        refreshtk: refreshToken,
      };
      await userapischema.add(newUser);
      return log(null, profile);
    } else {
      const uptUser = {
        codigouser: profile.id,
        username: profile.username,
        acesstk: accessToken,
        refreshtk: refreshToken,
      };
      await userapischema.update(profile.id, uptUser);
      return log(null, profile);
    }
  }
);

passport.use(disc);
refresh.use(disc);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[ERROR] Unhandled Exception:", err);
  res.status(500).send("Something broke!");
});

if (process.env.AMBIENT == "developer" || process.env.AMBIENT == "dev") {
  const PORT = process.env.PORT || 3006;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
} else if (process.env.AMBIENT == "production") {
  const server = http.createServer(app);
  const PORT = process.env.PORT || 3006;
  server.listen(PORT, () => {
    console.log(`Servidor rodando em Produção na porta ${PORT}`);
  });
}



