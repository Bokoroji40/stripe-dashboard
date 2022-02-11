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

  const stripeIDs = await getStripeIDFromSupabase(accessToken);
  const links = await getStripeSessionLink(stripeIDs);

  return {
    statusCode: 200,
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
      console.info("got a response");
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (!response.data || response.data.length === 0) {
        throw new Error("data is either missing, or empty array");
      }

      custID = response.data.reduce(customerIDCollector);
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
    });

  return custID;
};

const customerIDCollector = function (previous, current) {
  if (current.stripe_customer_id) {
    previous.push(current.stripe);
  }

  return previous;
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
