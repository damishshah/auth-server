// Express setup
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cors
const cors = require("cors");
app.use(cors());

// Setup .env file config
const dotenv = require("dotenv");
dotenv.config();

// Setup Passport
const passport = require("passport");
app.use(passport.initialize());
require("./middlewares/jwt")(passport);

// Wire routes
require("./routes/index")(app);

// Required for rate limiting
app.set("trust proxy", 1);

module.exports = app;
