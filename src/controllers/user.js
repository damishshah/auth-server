const { UserSchema } = require("../models/user");

// @route GET api/user/
// @desc Returns a specific user
// @access Public
exports.show = async function (req, res) {
  var user = req.user;
  delete user.password;
  res.status(200).json(user);
};

// @route PUT api/user/{id}
// @desc Update user details
// @access Public
exports.update = async function (req, res) {
  try {
    const update = req.body;
    const user = req.user;

    await user
      .update({ ...update })
      .then(() => {
        return res.status(200).json({ message: "User has been updated" });
      })
      .catch((error) => {
        console.log(`Unable to update user. Error: `, JSON.stringify(error));
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE api/user/{id}
// @desc Delete User
// @access Public
exports.delete = async function (req, res) {
  try {
    const password = req.body.password;
    const user = req.user;

    user
      .delete(password)
      .then(() => {
        res.status(200).json({ message: "User has been deleted" });
      })
      .catch((error) => {
        console.log(`Unable to delete user. Error: `, JSON.stringify(error));
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
