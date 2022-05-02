//jshint esversion:6
/*--------------------npm packages------------------*/
require('dotenv').config() // to use values from the .env environment and also to keep it safe.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption'); //mongoose encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;

/*--------------------Usage declairation------------------*/
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/*-----------------------DB connenction------------------- */
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

//schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String
});

/*-----------------------Level 2 authetincation using Aes cipher--------------*/

// Note:-mongoose.model should come afte the encryption/authentication
const User = mongoose.model("User", UserSchema);
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

/*-----------------------Post request----------------------- */
app.post("/register", function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err) {
            if (!err) {
                console.log("new entry stored");
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
    });

})

app.post("/login", function(req, res) {
    const newusername = req.body.username;
    const newpassword = req.body.password;
    User.findOne({ email: newusername }, function(err, founditem) {
        bcrypt.compare(newpassword, founditem.password, function(err, result) {
            // result == true
            if (result === true) {
                res.render("secrets");
            }
        });

    })
});

/*---------------------Port Declaration--------------------- */
app.listen(3000, function() {
    console.log("server started at port 3000")
});