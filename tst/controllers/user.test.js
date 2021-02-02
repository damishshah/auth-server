const app = require("auth-server/src/app");
const request = require("supertest");

const { createTestUser, testPassword } = require("auth-server/tst/utils");
const { UserSchema } = require("auth-server/src/models/user");

describe("Test user functions", () => {
  test("GET path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);

    // Create JWT token to verify with
    const token = testUser.generateSessionToken();

    // Make verify request
    const response = await request(app)
      .get(`/api/user/`)
      .set("Authorization", `BEARER ${token}`);

    // Confirm response
    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.firstName).toBe(testUser.firstName);
    expect(response.body.lastName).toBe(testUser.lastName);

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("PUT path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);

    // Create JWT token to verify with
    const token = testUser.generateSessionToken();

    const newEmail = "newemail@gmail.com";
    // Make verify request
    const response = await request(app)
      .put(`/api/user/`)
      .set("Authorization", `BEARER ${token}`)
      .set("Content-Type", "application/json")
      .send({
        email: newEmail,
        password: testPassword,
      });

    // Confirm response
    expect(response.statusCode).toBe(200);

    await UserSchema.query(testUser.id).then((user) => {
      expect(user.email).toBe(newEmail);
      expect(user.firstName).toBe(testUser.firstName);
      expect(user.lastName).toBe(testUser.lastName);
      expect(user.comparePassword(testPassword)).toBe(true);
      // Changing email should reset account verification
      expect(user.isVerified).toBe(false);
    });

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("DELETE path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);

    await UserSchema.query(testUser.id).then((user) => {
      expect(user).toBeDefined();
    });

    // Create JWT token to verify with
    const token = testUser.generateSessionToken();

    // Make verify request
    const response = await request(app)
      .delete(`/api/user/`)
      .set("Authorization", `BEARER ${token}`)
      .send({ password: testPassword });

    // Confirm response
    expect(response.statusCode).toBe(200);

    await UserSchema.query(testUser.id).catch((error) => {
      expect(error).toBeDefined();
    });
  });
});
