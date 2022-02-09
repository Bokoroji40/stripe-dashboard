exports.handler = async function (event, context) {
  console.info(event.body);
  return {
    statusCode: 200,
    body: "all good",
  };
};
