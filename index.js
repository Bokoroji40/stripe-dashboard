var SUPABASE_URL = "https://uavpsmlmcsfcplfxuubi.supabase.co";
var SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQzMTI5NTc1LCJleHAiOjE5NTg3MDU1NzV9.e0aZ2SUi8lpURmx72EmqKSZgvmAUYazp28Tus7PKl6Y";

var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", function (event) {
  var signUpForm = document.querySelector("#sbform");
  signUpForm.onsubmit = signUpSubmitted.bind(signUpForm);
});

const signUpSubmitted = (event) => {
  event.preventDefault();
  console.log(event);
  const email = event.target[0].value;

  supabase.auth
    .signIn({ email })
    .then((response) => {
      response.error ? alert(response.error.message) : setToken(response);
    })
    .catch((err) => {
      alert(err);
    });

  console.log(response);
};

function setToken(response) {
  if (response.user.confirmation_sent_at && !response?.session?.access_token) {
    alert("Confirmation Email Sent");
  } else {
    alert("Logged in as " + response.user.email);
  }
}
