//jshint esversion:6
/*--------------------npm packages------------------*/
require('dotenv').config() // to use values from the .env environment and also to keep it safe.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption'); //mongoose encryption
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const res = require('express/lib/response');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
    /*--------------------Usage declairation------------------*/
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: 'our little secret',
    resave: false,
    saveUninitialized: false,

}))
app.use(passport.initialize());
app.use(passport.session());
/*-----------------------DB connenction------------------- */
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

//schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate)

/*-----------------------Level 6 authetincation using Oauth20--------------*/

// Note:-mongoose.model should come afte the encryption/authentication
const User = mongoose.model("User", UserSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileUEL: "http://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));
/*-----------------------------Get request----------------- */
app.get("/", function(req, res) {
    res.render("home");
});
app.get("/login", function(req, res) {
    res.render("login");
})
app.get("/register", function(req, res) {
    res.render("register");
})
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");

})
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });
app.get("/secrets", function(req, res) {
    User.find({ "secret": { $ne: null } }, function(err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundUsers);
            res.render("secrets", { array: foundUsers });
        }
    });
});
app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login");
    }
})

/*-----------------------Post request----------------------- */
app.post("/register", function(req, res) {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/secrets");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        }
    })

})

app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/submit", function(req, res) {
    const subSecret = req.body.secret
    console.log(req.user.id);
    User.findById(req.user.id, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            if (found) {
                found.secret = subSecret;
                found.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
    })
})

/*---------------------Port Declaration--------------------- */
app.listen(3000, function() {
    console.log("server started at port 3000")
});