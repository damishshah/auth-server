const auth = require("./auth");
const user = require("./user");
const authenticate = require("../middlewares/authenticate");
const rateLimit = require("express-rate-limit");

const defaultRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 10 requests per windowMs
  message: "You're doing that too much, please try again later",
});

module.exports = (app) => {
  app.get("/", defaultRateLimiter, (req, res) => {
    res.status(200).send();
  });

  app.use("/api/auth", defaultRateLimiter, auth);
  app.use("/api/user", defaultRateLimiter, authenticate, user);
};
