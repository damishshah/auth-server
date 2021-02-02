const { UserSchema } = require("auth-server/src/models/user");

const testEmail = "damish.shah@gmail.com";
const testFirstName = "damish";
const testLastName = "shah";
const testPassword = "thisisapassword";

const createTestUser = async (verify) => {
  const testUser = UserSchema.create(
    { firstName: testFirstName, lastName: testLastName },
    testEmail,
    testPassword
  );
  testUser.isVerified = verify;
  await testUser.put();
  console.log("testUser ", JSON.stringify(testUser));
  return testUser;
};

module.exports = {
  createTestUser,
  testEmail,
  testFirstName,
  testLastName,
  testPassword,
};
