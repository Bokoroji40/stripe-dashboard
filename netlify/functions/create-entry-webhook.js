const axios = require("axios").default;
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const bodyParser = require("body-parser");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async function (event, context) {
  console.log("context is this", context);
  console.log("event is this", event);
  // Handle the event
  switch (event.type) {
    case "customer.created":
    case "customer.updated":
      const customer = event.data.object;
      const success = upsertUser(customer.email, customer.id);
      if (!success) {
        console.error("could not create / update user :(");
      }
      break;
    case "customer.deleted":
      const customer = event.data.object;
      console.info("deleting user happened, customer id is: " + customer.id);
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return {
    statusCode: 200,
    body: "all good",
  };
};

const upsertUser = function (email, customer_id) {
  const requestData = {
    email: email,
    stripe_customer_id: customer_id,
  };
  let status = true;

  await axios
    .post(process.env.SUPA_URL + "/rest/v1/stripe_customers", requestData, {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + process.env.SUPA_DANGER_KEY,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (!response.data || response.data.length !== 1) {
        throw new Error("data is either missing, or more than one row");
      }
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
      status = false;
    });

  return status;
};

const deleteUser = function (email, customer_id) {
  const requestData = {
    email: email,
    stripe_customer_id: customer_id,
  };
  let status = true;

  await axios
    .post(process.env.SUPA_URL + "/rest/v1/stripe_customers", requestData, {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + process.env.SUPA_DANGER_KEY,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (!response.data || response.data.length !== 1) {
        throw new Error("data is either missing, or more than one row");
      }
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
      status = false;
    });

  return status;
};
