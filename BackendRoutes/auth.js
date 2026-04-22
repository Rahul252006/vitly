const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = function (passport) {

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === "production"
            ? "https://vitly.onrender.com/auth/google/callback"
            : "http://localhost:3000/auth/google/callback"
    },
        (accessToken, refreshToken, profile, done) => {

            const email = profile.emails[0].value;

            if (!email.endsWith("@vitstudent.ac.in")) {
                return done(null, false);
            }

            return done(null, profile);
        }));

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

}