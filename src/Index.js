const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const authRoutes = require("./routes/auth");
const getdata = require("./routes/getdata");
const discordBot = require("./Client");
const mongoose = require("mongoose");
const UsersAPIRepository = require("../src/database/mongoose/UsersAPIRepository");
const UserAPISchema = require("../src/database/schemas/UserAPISchema");
mongoose.model("APIUsers", UserAPISchema);

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.urlencoded());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/public"));

app.use(
  session({
    secret: "ASDFASDFASFHADFHAEHGAEH",
    resave: false,
    saveUninitialized: false,
    //cookie:
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/bot", getdata);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["identify", "email", "guilds"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const userapischema = new UsersAPIRepository(mongoose, "APIUsers");
      const user = await userapischema.findOne(profile.id); // Salve os detalhes do usuário no banco de dados se necessário

      if (!user) {
        const newUser = {
          codigouser: profile.id,
          username: profile.username,
        };

        await userapischema.add(newUser);
      }

      return done(null, profile);
    }
  )
);



app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("dashboard.ejs", { user: req.user });
  } else {
    res.redirect("/");
  }
});

// Rota para a página de detalhes da guilda
app.get("/botinfo/:guildId", async (req, res) => {
  const selectedGuildId = req.params.guildId;

  try {
    // Aguarde a inicialização do cliente Discord.js
    await discordBot.guilds.fetch(selectedGuildId);

    // Obtenha dados da guilda
    const guild = discordBot.guilds.cache.get(selectedGuildId);

    // Renderize a página com as informações da guilda
    res.render("guildcontentmain.ejs", { info: guild });
  } catch (error) {
    console.error(error);
    res.status(500).render("error.ejs");
  }
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
