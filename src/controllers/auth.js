const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const { UserSchema } = require("../models/user");
const { sendEmail } = require("../utils/index");

let verify = promisify(jwt.verify).bind(jwt);

// @route POST api/auth/register
// @desc Register user
// @access Public
exports.register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    const user = await UserSchema.scan(email);

    if (user)
      return res.status(401).json({
        message:
          "The email address you have entered is already associated with another account.",
      });

    const newUser = UserSchema.create(name, email, password);
    newUser
      .put()
      .then(() => {
        console.log(`Save succeeded for user id ${JSON.stringify(newUser.id)}`);
        sendVerificationEmail(newUser, req, res);
      })
      .catch((error) => {
        console.error(
          `Unable to register new user. Error: ${JSON.stringify(error)}`
        );
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST api/auth/login
// @desc Login user and return JWT token
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserSchema.scan(email);

    //validate email
    if (!user)
      return res.status(401).json({ msg: "Invalid email or password" });

    //validate password
    if (!user.comparePassword(password))
      return res.status(401).json({ message: "Invalid email or password" });

    // Make sure the user has been verified
    if (!user.isVerified)
      return res.status(401).json({
        type: "not-verified",
        message: "Your account has not been verified.",
      });

    // Login successful, write token, and send back user
    res
      .status(200)
      .json({ token: user.generateSessionToken(), user: user.email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET api/auth/verify/:token
// @desc Verify token
// @access Public
exports.verify = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token)
      return res.status(400).json({ message: "Please submit a valid token." });

    verify(token, process.env.JWT_VERIFICATION_SECRET)
      .then((payload) => {
        if (!payload || !payload.id || !payload.email)
          return res.status(401).json({
            message: "Password reset token is invalid or has expired.",
          });

        UserSchema.query(payload.id)
          .then((user) => {
            if (!user)
              return res.status(400).json({
                message: "We were unable to find a user for this token.",
              });
            if (user.isVerified)
              return res
                .status(400)
                .json({ message: "This user has already been verified." });
            if (user.email !== payload.email) {
              return res.status(400).json({
                message:
                  "Email may have changed for this user, please request a new verification token.",
              });
            }

            // Verify and save the user
            user
              .verify()
              .then(() => {
                res
                  .status(200)
                  .send("The account has been verified. Please log in.");
              })
              .catch((error) => {
                console.error(
                  `Unable to update user verification. Error: ${JSON.stringify(
                    error
                  )}`
                );
                res
                  .status(500)
                  .json({ success: false, message: error.message });
              });
          })
          .catch((error) => {
            console.error(
              `Unable to verify user. Error: ${JSON.stringify(error)}`
            );
            res.status(500).json({ success: false, message: error.message });
          });
      })

      .catch((error) => {
        console.error(`Unable to verify user. Error: ${JSON.stringify(error)}`);
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST api/auth/resend
// @desc Resend Verification Token
// @access Public
exports.resendToken = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserSchema.scan(email);

    if (!user)
      return res.status(401).json({
        message:
          "The email address " +
          req.body.email +
          " is not associated with any account. Double-check your email address and try again.",
      });

    if (user.isVerified)
      return res.status(400).json({
        message: "This account has already been verified. Please log in.",
      });

    await sendVerificationEmail(user, req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function sendVerificationEmail(user, req, res) {
  try {
    const token = user.generateVerificationToken();

    let subject = "Account Verification Token";
    let to = user.email;
    let from = process.env.FROM_EMAIL;
    let link = "http://" + req.headers.host + "/api/auth/verify/" + token;
    let html = `<p>Hi ${user.firstName}<p><br><p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
                  <br><p>If you did not request this, please ignore this email.</p>`;

    console.log(link);
    sendEmail({ to, from, subject, html });

    res.status(200).json({
      userId: user.id,
      message: "A verification email has been sent to " + user.email + ".",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Unable to send verification email" });
  }
}
