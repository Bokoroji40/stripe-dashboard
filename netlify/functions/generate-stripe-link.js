exports.handler = async function (event, context) {
  console.log("this is a thing here", JSON.stringify(event.body));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};
