require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const app = express();
app.use(express.static(__dirname));
app.use(session({
   secret: "vitlysecret",
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

require("./BackendRoutes/auth")(passport);

/* HOME PAGE */
app.get("/", (req, res) => {
   if (req.isAuthenticated()) {
      return res.redirect("/dashboard");
   }

   res.sendFile(path.join(__dirname, "Frontend", "login.html"));
});
/* GOOGLE LOGIN ROUTE */
app.get("/auth/google",
   passport.authenticate("google", {
      scope: ["profile", "email"]
   })
);

/* CALLBACK ROUTE */
app.get("/auth/google/callback",
   passport.authenticate("google", {
      failureRedirect: "/"
   }),
   (req, res) => {
      res.redirect("/dashboard");
   });
/* DASHBOARD */
app.get("/dashboard", (req, res) => {
   if (req.isAuthenticated()) {
      return res.sendFile(__dirname + "/Frontend/dashboard.html");
   }

   res.redirect("/");
});

app.get("/logout", (req, res) => {
   req.logout(function (err) {
      if (err) { return next(err); }

      req.session.destroy(() => {
         res.redirect("/");
      });
   });
});

app.get("/api/user", (req, res) => {
   if (req.isAuthenticated()) {
      res.json({
         name: req.user.displayName,
         email: req.user.emails && req.user.emails.length > 0 ? req.user.emails[0].value : "N/A",
         picture: req.user.photos && req.user.photos.length > 0 ? req.user.photos[0].value : ""
      });
   } else {
      res.status(401).json({ error: "Not authenticated" });
   }
});

app.delete("/api/delete-user", (req, res) => {
   if (req.isAuthenticated()) {
      req.logout(function (err) {
         if (err) return res.status(500).json({ error: "Failed to delete" });
         req.session.destroy(() => {
            res.json({ success: true });
         });
      });
   } else {
      res.status(401).json({ error: "Not authenticated" });
   }
});

app.get("/profile", (req, res) => {
   if (req.isAuthenticated()) {
      return res.sendFile(path.join(__dirname, "Frontend", "profile.html"));
   }
   res.redirect("/");
});

app.get("/cgpa_Calc", function (req, res) {
   if (req.isAuthenticated()) {
      return res.sendFile(__dirname + "/Frontend/cgpa_calc.html");
   }
   res.redirect("/");
});

app.get("/FFCS", function (req, res) {
   if (req.isAuthenticated()) {
      return res.sendFile(path.join(__dirname, "Frontend", "ffcs_planner.html"));
   }
   res.redirect("/");
});

app.get("/policy", function (req, res) {
   res.sendFile(path.join(__dirname, "Frontend", "policy.html"));
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
   res.status(204).end();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log(`Running on ${PORT}`);
});