const express = require("express");
const rateLimit = require("express-rate-limit");
const { check } = require("express-validator");

const Auth = require("../controllers/auth");
const Password = require("../controllers/password");
const validate = require("../middlewares/validate");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Auth endpoint",
  });
});

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message:
    "Too many accounts created from this IP, please try again after an hour",
});

router.post(
  "/register",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password")
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("Must be at least 8 chars long"),
    check("name").not().isEmpty().withMessage("You name is required"),
  ],
  validate,
  createAccountLimiter,
  Auth.register
);

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 10, // start blocking after 10 requests
  skipSuccessfulRequests: true,
  message:
    "Too many failed login attempts from this ip, please try again in 5 minutes",
});

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password").not().isEmpty(),
  ],
  validate,
  loginLimiter,
  Auth.login
);

router.get("/verify/:token", Auth.verify);
router.post("/resend", Auth.resendToken);

//Password reset
router.post(
  "/recover",
  [check("email").isEmail().withMessage("Enter a valid email address")],
  validate,
  Password.recover
);

router.get("/reset/:token", Password.reset);

router.post(
  "/reset",
  [
    check("password")
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("Must be at least 8 chars long"),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
    check("token").not().isEmpty(),
  ],
  validate,
  Password.resetPassword
);

module.exports = router;
