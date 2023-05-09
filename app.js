require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

console.log(process.env.API_KEY);

app.set('view enginge', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userAuthDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema created from the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// this should be created before the Mongoose model because
// the mongoose model uses userSchema(what's on .env file)

//encrypt the password
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema);


app.get("/", (req, res) => {
    res.render("home.ejs");
});


app.get("/login", (req, res) => {
    res.render("login.ejs");
});


app.get("/register", (req, res) => {
    res.render("register.ejs");
});


app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save().then(
        () => {
            res.render("secrets.ejs");
        }
    ).catch(
        (err) => {
            console.log(err);
        }
    );
});


app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // when it reaches this step, mongoose decrypts the password in order to fulfill the findOne
    User.findOne({ email: username }).then(
        (foundUser) => {
            // if we found the user with the specific email
            if (foundUser) {
                // if the email found has the specific password the user typed in we render secrets
                if (foundUser.password === password) {
                    res.render("secrets.ejs");
                }
            }
        }
    ).catch(
        (err) => {
            console.log(err);
        }
    )
});








app.listen(3000, () => {
    console.log("Server started on port 3000");
});