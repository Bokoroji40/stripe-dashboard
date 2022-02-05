exports.handler = async function (event, context) {
  console.log("this is a thing here", JSON.stringify(event.body));

  accessToken = JSON.stringify({ message: event.body });
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  decodedHeader = Buffer.from(header, "base64").toString("ascii");
  decodedPayload = Buffer.from(payload, "base64").toString("ascii");
  decodedSignature = Buffer.from(signature, "base64").toString("ascii");

  console.log(
    "decodeds",
    JSON.stringify(decodedHeader),
    JSON.stringify(decodedPayload),
    JSON.stringify(decodedSignature),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
