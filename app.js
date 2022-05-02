//jshint esversion:6
/*--------------------npm packages------------------*/
require('dotenv').config() // to use values from the .env environment and also to keep it safe.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption'); //mongoose encryption
const md5 = require("md5"); //hashing function 

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
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save(function(err) {
        if (!err) {
            console.log("new entry stored");
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
})

app.post("/login", function(req, res) {
    const newusername = req.body.username;
    const newpassword = md5(req.body.password); //md5 is used to for hashing
    User.findOne({ email: newusername }, function(err, founditem) {
        if (!err) {
            if (founditem) {
                if (founditem.password === newpassword) {
                    res.render("secrets");
                }
            } else {
                console.log("username with that entry not found");
            }
        } else {
            console.log(err);
        }
    })
});

/*---------------------Port Declaration--------------------- */
app.listen(3000, function() {
    console.log("server started at port 3000")
});