jest.mock("@sendgrid/mail");
const sgMail = require("@sendgrid/mail");
const defaultMailOptions = { response: "Okay" };

beforeEach(() => {
  global.mockMailer = (options = defaultMailOptions) => {
    return sgMail.send.mockImplementation((requestOptions, callback) => {
      callback(null, options);
    });
  };
});

afterEach(() => {
  jest.clearAllMocks();
});
