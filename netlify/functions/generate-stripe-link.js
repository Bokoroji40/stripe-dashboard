const crypto = require("crypto");

exports.handler = async function (event, context) {
  accessToken = event.body;
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  const hash = crypto
    .createHmac("sha256", process.env.SUPA_JWT_SECRET)
    .update(header + "." + payload)
    .digest("base64url");

  console.info(
    "hash vs sig\n",
    typeof hash,
    hash,
    "\n",
    typeof signature,
    signature,
  );

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
