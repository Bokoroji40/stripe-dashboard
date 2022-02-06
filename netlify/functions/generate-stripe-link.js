const crypto = require("crypto");
const https = require("https");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

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

  if (hash !== signature) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "jwt signature verification failed" }),
    };
  }

  const stripeID = await getStripeIDFromSupabase(accessToken);

  console.log("this is the stripe id", stripeID);
  //   const link = await getStripeSessionLink(stripeID);

  //   console.log("this is the link that came back", link);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};

const getStripeIDFromSupabase = async function (accessToken) {
  const req = https.request(
    "https://uavpsmlmcsfcplfxuubi.supabase.co/rest/v1/stripe_customers",
    {
      method: "GET",
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + accessToken,
      },
    },
    (res) => {
      let rdata = "";
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        rdata += chunk;
        console.log(`BODY: ${chunk}`);
      });
      res.on("end", () => {
        console.log("No more data in response.");

        console.log("the entire data is this");
        console.warn(rdata);

        return rdata;
      });
    },
  );

  req.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
    return "";
  });

  req.end();
};

const getStripeSessionLink = async function (stripeID) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeID,
    return_url: "https://jovial-borg-90bf04.netlify.app/",
  });

  return session.url;
};
