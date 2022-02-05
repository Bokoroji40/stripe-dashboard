exports.handler = async function (event, context) {
  console.log("this is a thing here", JSON.stringify(event.body));

  accessToken = JSON.stringify(event.body);
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  console.info("parts", header, payload, signature);

  decodedHeader = Buffer.from(header, "base64url").toString("ascii");
  decodedPayload = Buffer.from(payload, "base64url").toString("ascii");
  decodedSignature = Buffer.from(signature, "base64url").toString("ascii");

  console.log("decodeds", decodedHeader, decodedPayload, decodedSignature);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
