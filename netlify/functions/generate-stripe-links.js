const crypto = require("crypto");
const axios = require("axios").default;
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
};

exports.handler = async function (event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  accessToken = event.body;
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  const hash = crypto
    .createHmac("sha256", process.env.SUPA_JWT_SECRET)
    .update(header + "." + payload)
    .digest("base64url");

  console.warn(hash, header, payload, signature);

  if (hash !== signature) {
    return {
      statusCode: 418,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "jwt signature verification failed" }),
    };
  }

  const stripeIDs = await getStripeIDFromSupabase(accessToken);
  const links = await getStripeSessionLink(stripeIDs);

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ links: links }),
  };
};

const getStripeIDFromSupabase = async function (accessToken) {
  let custID = [];

  await axios
    .get(process.env.SUPA_URL + "/rest/v1/stripe_customers", {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + accessToken,
      },
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (!response.data || response.data.length === 0) {
        throw new Error("data is either missing, or empty array");
      }

      for (const cust_record of response.data) {
        custID.push(cust_record.stripe_customer_id);
      }
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
    });

  return custID;
};

const getStripeSessionLink = async function (stripeIDs) {
  let sessions = [];

  for (const id of stripeIDs) {
    const session = await stripe.billingPortal.sessions.create({
      customer: id,
      return_url: process.env.FRONTEND_URL,
    });

    sessions.push(session);
  }

  return sessions;
};
