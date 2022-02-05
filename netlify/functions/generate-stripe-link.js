const crypto = require("crypto");
const https = require("https");

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

  const req = https.request(
    "https://uavpsmlmcsfcplfxuubi.supabase.co/rest/v1/stripe_customers",
    {
      method: "GET",
      headers: {
        apikey: accessToken,
        Authorization: "Bearer " + process.env.SUPA_ANON_KEY,
      },
    },
    (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        console.log(`BODY: ${chunk}`);
      });
      res.on("end", () => {
        console.log("No more data in response.");
      });
    },
  );

  req.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
