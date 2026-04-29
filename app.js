import pool from "./db.js";

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const db = require("./db");

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

app.get("/papers", function (req, res) {
   if (req.isAuthenticated()) {
      return res.sendFile(path.join(__dirname, "Frontend", "papers.html"));
   }
   res.redirect("/");
});

app.get("/paper-preview", (req, res) => {
   if (req.isAuthenticated()) {
      return res.sendFile(path.join(__dirname, "Frontend", "paper_preview.html"));
   }
   res.redirect("/");
});

// Fetch all papers from the database
app.get("/api/papers", async (req, res) => {
   if (req.isAuthenticated()) {
      try {
         // We omit fileUrl here to keep the listing response small
         const [rows] = await db.execute("SELECT courseCode, subject, year, slot, examType, uploadedBy, displayName, createdAt FROM papers ORDER BY createdAt DESC");
         res.json(rows);
      } catch (error) {
         console.error("Database error:", error);
         res.status(500).json({ error: "Failed to fetch papers from database" });
      }
   } else {
      res.status(401).json({ error: "Not authenticated" });
   }
});

// Fetch single paper content by composite key
app.get("/api/paper-details", async (req, res) => {
   if (req.isAuthenticated()) {
      const { courseCode, slot, year, examType } = req.query;
      try {
         const [rows] = await db.execute(
            "SELECT fileUrl FROM papers WHERE courseCode = ? AND slot = ? AND year = ? AND examType = ?",
            [courseCode, slot, year, examType]
         );

         if (rows.length > 0) {
            res.json(rows[0]);
         } else {
            res.status(404).json({ error: "Paper not found" });
         }
      } catch (error) {
         console.error("Database error:", error);
         res.status(500).json({ error: "Failed to fetch paper details" });
      }
   } else {
      res.status(401).json({ error: "Not authenticated" });
   }
});

// Upload a new paper to the database
app.post("/api/upload-paper", express.json({ limit: '50mb' }), async (req, res) => {
   if (req.isAuthenticated()) {
      const { courseCode, subject, year, slot, examType, fileData, showName } = req.body;
      const uploadedBy = showName ? req.user.displayName : "Anonymous";

      try {
         // Check for redundancy based on composite primary key
         const [existing] = await db.execute(
            "SELECT 1 FROM papers WHERE courseCode = ? AND slot = ? AND year = ? AND examType = ?",
            [courseCode, slot, year, examType]
         );

         if (existing.length > 0) {
            return res.status(400).json({ error: "Paper already exists for this subject and year." });
         }

         // Insert new paper
         await db.execute(
            "INSERT INTO papers (courseCode, subject, year, slot, examType, uploadedBy, displayName, fileUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [courseCode, subject, year, slot, examType, uploadedBy, showName, fileData]
         );

         res.json({ success: true });
      } catch (error) {
         console.error("Database error:", error);
         res.status(500).json({ error: "Failed to save paper to database" });
      }
   } else {
      res.status(401).json({ error: "Not authenticated" });
   }
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
   res.status(204).end();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log(`Running on ${PORT}`);
});