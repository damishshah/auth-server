const app = require("auth-server/src/app");
const request = require("supertest");

const { createTestUser, testPassword } = require("auth-server/tst/utils");
const { UserSchema } = require("auth-server/src/models/user");

describe("Test password functions", () => {
  test("Recover path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);

    // Make verify request
    const response = await request(app)
      .post(`/api/auth/recover`)
      .set("Content-Type", "application/json")
      .send({ email: testUser.email });

    // Confirm response
    expect(response.statusCode).toBe(200);

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("Reset GET path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);
    const token = testUser.generatePasswordResetToken();

    // Make verify request
    const response = await request(app).get(`/api/auth/reset/${token}`);

    // Confirmsponse
    expect(response.statusCode).toBe(200);

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("Reset POST path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);
    const token = testUser.generatePasswordResetToken();
    const newPassword = "newPassword";

    // Make verify request
    const response = await request(app)
      .post(`/api/auth/reset/`)
      .set("Content-Type", "application/json")
      .send({
        password: newPassword,
        confirmPassword: newPassword,
        token: token,
      });

    console.error(JSON.stringify(response));

    // Confirmsponse
    expect(response.statusCode).toBe(200);

    // Query registered user and verify fields
    await UserSchema.query(testUser.id).then((user) => {
      expect(user.comparePassword(newPassword)).toBe(true);
    });

    // Cleanup
    await testUser.delete(testPassword);
  });
});
