const crypto = require("crypto");
const axios = require("axios").default;
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
  const link = await getStripeSessionLink(stripeID);

  return {
    statusCode: 200,
    body: JSON.stringify({ link: link }),
  };
};

const getStripeIDFromSupabase = async function (accessToken) {
  console.log("starting axios await");
  let custID = "";
  await axios
    .get(process.env.SUPA_URL + "/rest/v1/stripe_customers", {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + accessToken,
      },
    })
    .then((response) => {
      console.info("got a response");
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (!response.data || response.data.length !== 1) {
        throw new Error("data is either missing, or more than one row");
      }

      if (!response.data[0].stripe_customer_id) {
        throw new Error("stripe customer id is missing from response data");
      }
      console.info("hm, returning from here is bad, setting custid");
      custID = response.data[0].stripe_customer_id;
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
    });

  return custID;
};

const getStripeSessionLink = async function (stripeID) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeID,
    return_url: process.env.FRONTEND_URL,
  });

  return session.url;
};
