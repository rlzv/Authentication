require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
//const localStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String
});

// add passport-local-mongoose to the mongoose schema
// to hash and salt passwords and to save users into the DB
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Serialize and Deserialize working for any kind of authentication
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(
        (user) => {
            done(user);
        }
    ).catch(
        (err) => {
            console.log(err);
        }
    );
});

// google strategy to login our user
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        // retrieve profile info from user info (endpoint on Google)
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    (accessToken, refreshToken, profile, cb) => {
        //console.log(profile);
        // we use the data that we get back from googleId to find or create users
        User.findOrCreate({ googleId: profile.id }, (err, user) => {
            return cb(err, user);
        });
    }
));



app.get("/", (req, res) => {
    res.render("home.ejs");
});


// initiate auth with google
app.get("/auth/google",

    passport.authenticate('google', { scope: ['profile'] })
);


app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    }
);


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