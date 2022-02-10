const axios = require("axios").default;
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const URL = require("url").URL;

exports.handler = async function (payload, context) {
  const sig = payload.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: err.message }),
    };
  }

  let customer;
  let error;
  switch (event.type) {
    case "customer.created":
    case "customer.updated":
      customer = event.data.object;
      error = await upsertUser(customer.email, customer.id);
      if (error !== null) {
        console.error("could not create / update user :(");
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "could not create / update user",
            error: error.message,
          }),
        };
      }
      break;
    case "customer.deleted":
      customer = event.data.object;
      error = await deleteUser(customer.id);
      if (error != null) {
        console.error("could not delete user :(");
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "could not delete user",
            error: error.message,
          }),
        };
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Ok" }),
  };
};

const upsertUser = async function (email, customer_id) {
  const requestData = {
    email: email,
    stripe_customer_id: customer_id,
  };

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
      return error;
    });

  return null;
};

const deleteUser = async function (customer_id) {
  const deleteURL = new URL("/rest/v1/stripe_customers", process.env.SUPA_URL);
  deleteURL.searchParams.append("stripe_customer_id", "eq." + customer_id);

  await axios
    .delete(deleteURL, {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + process.env.SUPA_DANGER_KEY,
        Prefer: "return=representation",
      },
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("response from supabase is not 200");
      }

      if (response.data && response.data.length === 0) {
        console.info(
          "we had no record of customer in supabase: " + customer_id,
        );
        return;
      }

      if (!response.data || response.data.length !== 1) {
        throw new Error("data is either missing, or more than one row");
      }
    })
    .catch((error) => {
      return error;
    });

  return null;
};
