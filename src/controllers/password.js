const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const { UserSchema } = require("../models/user");
const { sendEmail } = require("../utils/index");

let verify = promisify(jwt.verify).bind(jwt);

// @route POST api/auth/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
exports.recover = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserSchema.scan(email);

    if (!user) {
      res.status(200).json({
        message: `If the account exists, a reset email will be sent to ${email}`,
      });
    } else {
      //Generate and set password reset token
      const token = user.generatePasswordResetToken();

      // send email
      let subject = "Password change request";
      let to = user.email;
      let from = process.env.FROM_EMAIL;
      let link = "http://" + req.headers.host + "/api/auth/reset/" + token;
      let html = `<p>Hi ${user.firstName}</p>
                    <p>Please click on the following <a href="${link}">link</a> to reset your password.</p> 
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;

      console.log(`generated password reset link: ${link}`);
      sendEmail({ to, from, subject, html });

      res.status(200).json({
        message: `If the account exists, a reset email will be sent to ${email}`,
      });
    }
  } catch (error) {
    console.error(`Recover password attempt failed. Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET api/auth/reset
// @desc Reset Password - Validate password reset token and shows the password reset view
// @access Public
exports.reset = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenDecoded = jwt.decode(token);
    if (!tokenDecoded || !tokenDecoded.id) {
      return res.status(401).json({
        message: "Password reset token is invalid or has expired.",
      });
    }
    UserSchema.query(tokenDecoded.id)
      .then((user) => {
        if (!user)
          return res.status(400).json({
            message: "We were unable to find a user for this token.",
          });

        verify(token, user.getPasswordSecret())
          .then((payload) => {
            if (!payload || !payload.id)
              return res.status(401).json({
                message: "Password reset token is invalid or has expired.",
              });

            //Redirect user to form with the email address
            res.send(
              '<form action="/api/auth/reset" method="POST">' +
                '<input type="hidden" name="token" value="' +
                token +
                '" />' +
                '<input type="password" name="password" value="" placeholder="Enter your new password..." />' +
                '<input type="password" name="confirmPassword" value="" placeholder="Confirm your new password" />' +
                '<input type="submit" value="Reset Password" />' +
                "</form>"
            );
          })
          .catch((error) => {
            console.error(
              `Unable to verify the password reset token. Error: ${error}`
            );
            return res.status(401).json({
              message: "Password reset token is invalid or has expired.",
            });
          });
      })
      .catch((error) => {
        console.error(
          `Unable to query the user password reset token. Error: ${JSON.stringify(
            error
          )}`
        );
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST api/auth/reset
// @desc Reset Password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const tokenDecoded = jwt.decode(token);
    if (!tokenDecoded || !tokenDecoded.id) {
      return res.status(401).json({
        message: "Password reset token is invalid or has expired.",
      });
    }
    UserSchema.query(tokenDecoded.id)
      .then((user) => {
        if (!user)
          return res.status(400).json({
            message: "We were unable to find a user for this token.",
          });

        verify(token, user.getPasswordSecret()).then((payload) => {
          if (!payload || !payload.id)
            return res.status(401).json({
              message: "Password reset token is invalid or has expired.",
            });

          user
            .updatePassword(password)
            .then(() => {
              let subject = "Your password has been changed";
              let to = user.email;
              let from = process.env.FROM_EMAIL;
              let html = `<p>Hi ${user.firstName}</p>
                    <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>`;

              sendEmail({ to, from, subject, html });

              console.log(`Updated password for user ${user.id}`);
              res
                .status(200)
                .json({ message: "Your password has been updated." });
            })
            .catch((error) => {
              console.error(
                `Unable to update the reset password. Error: ${JSON.stringify(
                  error
                )}`
              );
              res.status(500).json({ success: false, message: error.message });
            });
        });
      })
      .catch((error) => {
        console.error(
          `Unable to query user during reset password. Error: ${JSON.stringify(
            error
          )}`
        );
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
