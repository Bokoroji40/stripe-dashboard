const stripe = require("stripe")(process.env.STRIPE_API_KEY);

exports.handler = async function (payload, context) {
  const sig = payload.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload.body,
      sig,
      process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("catching the error", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: err.message }),
    };
  }

  let subscription;
  let error;
  switch (event.type) {
    case "customer.subscription.created":
      subscription = event.data.object;

      // if we have more than one different types of line items, break.
      if (subscription.items.data.length !== 1) {
        break;
      }

      // if the price / product are not right, also break.
      if (
        subscription.items.data[0].price.id !==
          process.env.STRIPE_SIX_MO_PRICE_ID ||
        subscription.items.data[0].price.product !==
          process.env.STRIPE_SIX_MO_PRODUCT_ID
      ) {
        break;
      }

      try {
        error = await limitSubscription(subscription);
      } catch (err) {
        console.warn("the error message", err);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "could not limit subscription",
            error: err.message,
          }),
        };
      }

      break;
    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Ok" }),
  };
};

const limitSubscription = async function (subscription) {
  let schedule;
  let updatedSchedule;
  try {
    schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });
  } catch (err) {
    console.error("creating initial subscription schedule");
    throw e;
  }

  try {
    updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "cancel",
      phases: [
        {
          items: [
            {
              price: subscription.items.data[0].price.id,
              quantity: subscription.items.data[0].quantity,
            },
          ],
          start_date: "now",
          iterations: 6,
        },
      ],
    });
  } catch (err) {
    console.error("updating schedule");
    throw err;
  }

  console.info("updated schedule: ", updatedSchedule);
};
