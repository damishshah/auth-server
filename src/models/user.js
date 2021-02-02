const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../utils/dynamodb");

class UserSchema {
  constructor(id, firstName, lastName, email, password, isVerified, role) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.isVerified = isVerified;
    this.role = role;
  }

  static create(name, email, password, role) {
    return new UserSchema(
      uuidv4(),
      name.firstName,
      name.lastName,
      email,
      bcrypt.hashSync(password, 12),
      false,
      this.role
    );
  }

  static createFromItem(item) {
    return new UserSchema(
      item.id,
      item.firstName,
      item.lastName,
      item.email,
      item.password,
      item.isVerified,
      item.role
    );
  }

  static hashPassword(password) {
    return bcrypt.hashSync(password, 12);
  }

  comparePassword(password) {
    return bcrypt.compareSync(password, this.password);
  }

  generateSessionToken() {
    let payload = {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
    };

    return jwt.sign(payload, process.env.JWT_SESSION_SECRET, {
      expiresIn: "1d",
    });
  }

  generateVerificationToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
      },
      process.env.JWT_VERIFICATION_SECRET,
      {
        expiresIn: "1d",
      }
    );
  }

  generatePasswordResetToken() {
    return jwt.sign(
      {
        id: this.id,
      },
      this.getPasswordSecret(),
      {
        expiresIn: "1h",
      }
    );
  }

  getPasswordSecret() {
    return this.password + process.env.JWT_PASSWORD_SECRET;
  }

  async put() {
    const user = this;
    var params = {
      TableName: "users",
      Item: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        isVerified: user.isVerified,
      },
    };

    return docClient.put(params).promise();
  }

  async update(item) {
    if (item.email) {
      const scannedUser = await UserSchema.scan(item.email);

      if (!scannedUser) {
        // No one else is using this email, set to unverified
        item.isVerified = false;
      } else if (scannedUser && scannedUser.id !== this.id) {
        return Promise.reject(
          new Error(
            "The email address you have entered is already associated with another account."
          )
        );
      }
    }

    if (!this.comparePassword(item.password)) {
      return Promise.reject(new Error("Incorrect password."));
    }

    if (item.newPassword) {
      item.password = UserSchema.hashPassword(item.newPassword);
    } else {
      delete item.password;
    }

    var params = {
      TableName: "users",
      Key: { id: this.id },
      UpdateExpression: "set",
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };

    for (const property in item) {
      params.UpdateExpression += ` #${property} = :${property},`;
      params.ExpressionAttributeNames["#" + property] = property;
      params.ExpressionAttributeValues[":" + property] = item[property];
    }

    params.UpdateExpression = params.UpdateExpression.slice(0, -1);

    return docClient.update(params).promise();
  }

  async verify() {
    var params = {
      TableName: "users",
      Key: { id: this.id },
      UpdateExpression: "set isVerified = :true",
      ExpressionAttributeValues: { ":true": true },
    };

    return docClient.update(params).promise();
  }

  async updatePassword(password) {
    var params = {
      TableName: "users",
      Key: { id: this.id },
      UpdateExpression: "set password = :password",
      ExpressionAttributeValues: {
        ":password": UserSchema.hashPassword(password),
      },
    };

    return docClient.update(params).promise();
  }

  async delete(password) {
    if (!this.comparePassword(password)) {
      return Promise.reject(new Error("Incorrect password."));
    }

    var params = {
      TableName: "users",
      Key: { id: this.id },
    };

    return docClient.delete(params).promise();
  }

  static async query(userId) {
    var params = {
      TableName: "users",
      KeyConditionExpression: "id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    return docClient
      .query(params)
      .promise()
      .then((data) => {
        if (data && data.Items && data.Items.length) {
          console.log(`Query succeeded. Found data: ${JSON.stringify(data)}`);
          return UserSchema.createFromItem(data.Items[0]);
        }
      })
      .catch((error) => {
        console.error("Unable to query. Error:", JSON.stringify(error));
        throw new Error("User database query failed.");
      });
  }

  static async scan(email) {
    var params = {
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    let scanResults = [];
    let items;

    do {
      items = await docClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    if (scanResults && scanResults.length) {
      console.log(`Retrieve succeeded for user ${scanResults[0].id}`);
      return this.createFromItem(scanResults[0]);
    } else {
      console.log(`No user found for ${email}`);
    }
  }

  static async scanAll() {
    var params = {
      TableName: "users",
    };

    let scanResults = [];
    let items;

    do {
      items = await docClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    return scanResults;
  }
}

module.exports = { UserSchema };
