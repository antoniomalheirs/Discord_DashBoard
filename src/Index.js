const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy, refresh = require("passport-oauth2-refresh");
const authRoutes = require("./routes/auth");
const getdata = require("./routes/getdata");
const discordBot = require("./Client");
const mongoose = require("mongoose");
const UsersAPIRepository = require("../src/database/mongoose/UsersAPIRepository");
const UserAPISchema = require("../src/database/schemas/UserAPISchema");
mongoose.model("APIUsers", UserAPISchema);
const bodyParser = require("body-parser");
const http = require("http");
require("dotenv").config();

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(express.urlencoded());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/css"));
app.use(express.static(__dirname + "/public/layouts"));
app.use(express.static(__dirname + "/public/res/sidebar"));

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    name:"DivinaBot",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 360000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/bot", getdata);

var disc = new DiscordStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ["identify", "email", "guilds"],
  },
  async (accessToken, refreshToken, profile, log) => {
    const userapischema = new UsersAPIRepository(mongoose, "APIUsers");
    const user = await userapischema.findOne(profile.id); // Salve os detalhes do usuário no banco de dados se necessário

    if (!user) {
      const newUser = {
        codigouser: profile.id,
        username: profile.username,
        acesstk: accessToken,
        refreshtk: refreshToken,
      };

      await userapischema.add(newUser);

      return log(null, profile);
    } else if (user) {
      const uptUser = {
        codigouser: profile.id,
        username: profile.username,
        acesstk: accessToken,
        refreshtk: refreshToken,
      };

      await userapischema.update(profile.id,uptUser);

      return log(null, profile);
    }
  }
);

passport.use(disc);
refresh.use(disc);

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("dashboard.ejs", { user: req.user });
  } else {
    res.redirect("/");
  }
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

const server = http.createServer(app);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


