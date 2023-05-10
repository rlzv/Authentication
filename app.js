require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// how many times to salt the password
const saltRounds = 10;

const app = express();

//console.log(process.env.API_KEY);
//console.log(md5("123456"));

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

    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        // create user only when we generated our hash
        const newUser = new User({
            email: req.body.username,
            password: hash
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

});


app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // when it reaches this step, mongoose decrypts the password in order to fulfill the findOne
    User.findOne({ email: username }).then(
        (foundUser) => {
            // if we found the user with the specific email
            if (foundUser) {
                // compare the password that the user types with the one inside db
                if (bcrypt.compareSync(password, foundUser.password)) {
                    res.render("secrets.ejs");
                };
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