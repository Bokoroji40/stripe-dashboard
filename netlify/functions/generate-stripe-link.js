const { createHmac } = await import("crypto");

exports.handler = async function (event, context) {
  console.log("this is a thing here", JSON.stringify(event.body));

  accessToken = JSON.stringify(event.body);
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  console.info("parts", header, payload, signature);

  const hash = createHmac("sha256", process.env.SUPA_JWT_SECRET)
    .update(header + "." + payload)
    .digest("hex");

  console.log("hash, signature", hash, signature);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
