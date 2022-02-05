exports.handler = async function (event, context) {
  console.log(JSON.stringify(event.body));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
};
