const express = require("express");
const { check } = require("express-validator");

const User = require("../controllers/user");
const validate = require("../middlewares/validate");

const router = express.Router();

// User operations that require a valid JWT

router.get("/", User.show);

router.put(
  "/",
  [
    check("email")
      .optional()
      .isEmail()
      .withMessage("Enter a valid email address"),
    check("password")
      .not()
      .isEmpty()
      .withMessage("Please include password to update account"),
    check("newPassword")
      .if((value, { req }) => req.body.newPassword)
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 chars long"),
    check("confirmNewPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  validate,
  User.update
);

router.delete(
  "/",
  [
    check("password")
      .not()
      .isEmpty()
      .withMessage("Password required to delete account"),
  ],
  validate,
  User.delete
);

module.exports = router;
