var SUPABASE_URL = "https://uavpsmlmcsfcplfxuubi.supabase.co";
var SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQzMTI5NTc1LCJleHAiOjE5NTg3MDU1NzV9.e0aZ2SUi8lpURmx72EmqKSZgvmAUYazp28Tus7PKl6Y";

var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
var signUpForm;
var linksDiv;
var linksNum;
var linksUl;
var signOutButton;
var signedIn = false;

document.addEventListener("DOMContentLoaded", function () {
  signUpForm = document.querySelector("#sbform");
  linksDiv = document.querySelector("#the-links");
  linksNum = linksDiv.querySelector("span.num");
  linksUl = linksDiv.querySelector("ul");
  signOutButton = signUpForm.querySelector('button[type="reset"]');

  signUpForm.onsubmit = signIn.bind(signUpForm);
  signUpForm.onreset = signOut.bind(signUpForm);
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if ("SIGNED_IN" === event) {
    const response = await fetch("/.netlify/functions/generate-stripe-link", {
      method: "POST",
      body: session.access_token,
    });

    signOutButton.disabled = false;

    const result = await response.json();

    displayLinks(result.links);
  }

  if ("SIGNED_OUT" === event) {
    signOutButton.disabled = true;
    displayLinks({});
  }
});

const displayLinks = (payload) => {
  linksNum.innerHTML = payload.length;
  let lx = "";
  for (const [_, value] of Object.entries(payload)) {
    lx += '<li><a href="' + value.url + '">' + value.customer + "</a></li>";
  }

  linksUl.innerHTML = lx;
};

const signOut = (event) => {
  event.target[0].value = "";
  supabase.auth
    .signOut()
    .then(() => {
      console.warn("signed out successfully");
    })
    .catch((err) => {
      console.error("error while signing out", err);
    });
};
const signIn = (event) => {
  event.preventDefault();
  const email = event.target[0].value;

  supabase.auth
    .signIn({ email })
    .then((response) => {
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
