const request = require("supertest");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

let jwtverify = promisify(jwt.verify).bind(jwt);

const app = require("auth-server/src/app");
const { UserSchema } = require("auth-server/src/models/user");
const {
  createTestUser,
  testEmail,
  testFirstName,
  testLastName,
  testPassword,
} = require("auth-server/tst/utils");

beforeEach(() => mockMailer());

describe("Test authentication functions", () => {
  test("Root path", async () => {
    const response = await request(app).get("/api/auth/");
    expect(response.statusCode).toBe(200);
  });

  test("Register path", async () => {
    // Make register request
    const response = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send({
        name: {
          firstName: testFirstName,
          lastName: testLastName,
        },
        email: testEmail,
        password: testPassword,
      });

    // Confirm response
    expect(response.statusCode).toBe(200);
    expect(response.type).toEqual("application/json");

    // Query registered user and verify fields
    await UserSchema.query(response.body.userId).then((user) => {
      expect(user.email).toBe(testEmail);
      expect(user.firstName).toBe(testFirstName);
      expect(user.lastName).toBe(testLastName);
      expect(user.comparePassword(testPassword)).toBe(true);
      expect(user.isVerified).toBe(false);

      // Cleanup
      user.delete(testPassword);
    });
  });

  test("Verify path", async () => {
    // Create fake user
    const testUser = await createTestUser(false);

    // Create JWT token to verify with
    const token = testUser.generateVerificationToken();

    // Make verify request
    const response = await request(app).get(`/api/auth/verify/${token}`);

    // Confirm response
    expect(response.statusCode).toBe(200);

    // Query registered user and verify fields
    await UserSchema.query(testUser.id).then((user) => {
      expect(user.email).toBe(testUser.email);
      expect(user.isVerified).toBe(true);
    });

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("Login path", async () => {
    // Create fake user
    const testUser = await createTestUser(true);

    // Make login request
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send({
        email: testUser.email,
        password: testPassword,
      });

    // Confirm response
    expect(response.statusCode).toBe(200);

    jwtverify(response.body.token, process.env.JWT_SESSION_SECRET).then(
      (payload) => {
        expect(payload.email).toBe(testUser.email);
        expect(payload.firstName).toBe(testUser.firstName);
        expect(payload.lastName).toBe(testUser.lastName);
        expect(payload.id).toBe(testUser.id);
      }
    );

    // Cleanup
    await testUser.delete(testPassword);
  });

  test("Resend verification path", async () => {
    // Create fake user
    const testUser = await createTestUser(false);

    // Make login request
    const response = await request(app)
      .post("/api/auth/resend")
      .set("Content-Type", "application/json")
      .send({
        email: testUser.email,
      });

    // Confirm response
    expect(response.statusCode).toBe(200);

    // Cleanup
    await testUser.delete(testPassword);
  });
});
