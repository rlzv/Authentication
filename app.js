require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
//const localStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

//console.log(process.env.API_KEY);
//console.log(md5("123456"));

app.set('view enginge', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// start the session
app.use(session({
    secret: "It's my lil secret.",
    resave: false,
    saveUninitialized: false
}));

// initialize passport for authentication
app.use(passport.initialize());
// passport to use our session
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userAuthDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema created from the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// add passport-local-mongoose to the mongoose schema
// to hash and salt passwords and to save users into the DB
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
    res.render("home.ejs");
});


app.get("/login", (req, res) => {
    res.render("login.ejs");
});


app.get("/register", (req, res) => {
    res.render("register.ejs");
});

// function to remove cache
let nocache = (req, res, next) => {
    res.header('Cache-Control', 'private', 'no-cache', 'no-store', 'must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}

// remove the cache from /secrets page so when you hit prev button, you will be redirected to the login page!!
app.get("/secrets", nocache, (req, res) => { // route where you remove the cache
    //if the user is authenticated we render secrets page
    if (req.isAuthenticated()) {
        res.render("secrets.ejs");
    } else {
        res.redirect("/login");
    }

});


app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        } else {
            res.redirect("/");
        }
    });

});


app.post("/register", (req, res) => {
    // from passport-local-mongoose
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            // passport exposes a login() function on req that can be used to establish a login session
            // when the login operation completes, user will be assigned to req.user
            // passport.authenticate() middleware invokes req.login() automatically. This function is primarily used
            // when users sign up, during which req.login() can be invoked to auto log in the newly registered user!!
            // so i think passport.authenticate("local") checks the database and authenticate if the data matches and maybe req.login is not needed
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            })
        }
    });
});


app.post("/login", (req, res, next) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    passport.authenticate("local")(req, res, () => {
        req.login(user, (err) => {
            if (err) {
                return next(err);
            } else {
                return res.redirect("/secrets");
            }
        });
    })


});








app.listen(3000, () => {
    console.log("Server started on port 3000");
});