const crypto = require("crypto");

exports.handler = async function (event, context) {
  accessToken = JSON.stringify(event.body);
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  const hash = crypto
    .createHmac("sha256", process.env.SUPA_JWT_SECRET)
    .update(header + "." + payload)
    .digest("base64url");

  if (hash !== signature) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "jwt signature verification failed" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
