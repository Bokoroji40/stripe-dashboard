var SUPABASE_URL = "https://uavpsmlmcsfcplfxuubi.supabase.co";
var SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQzMTI5NTc1LCJleHAiOjE5NTg3MDU1NzV9.e0aZ2SUi8lpURmx72EmqKSZgvmAUYazp28Tus7PKl6Y";

var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", function (event) {
  var signUpForm = document.querySelector("#sbform");
  signUpForm.onsubmit = signIn.bind(signUpForm);
});

console.log("why are we reloading things");

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("something happened here, woo", event, session);
  if ("SIGNED_IN" === event) {
    console.log("access token is", session.access_token);
    const response = await fetch("/.netlify/functions/generate-stripe-link", {
      method: "POST",
      body: session.access_token,
    });

    const result = await response.json();

    console.log("thingy", result);
  }
});

const signIn = (event) => {
  event.preventDefault();
  const email = event.target[0].value;

  supabase.auth
    .signIn({ email })
    .then((response) => {
      console.log("supabase auth response", response);

      if (response.error) {
        alert(response.error.message);
      } else {
        setToken(response);
      }
    })
    .catch((err) => {
      console.log("supabase auth error");
      alert(err.response.text);
    });
};

function setToken(response) {
  if (response.user.confirmation_sent_at && !response?.session?.access_token) {
    alert("Confirmation Email Sent");
  } else {
    alert("Logged in as " + response.user.email);
  }
}
