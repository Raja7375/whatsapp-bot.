require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

let sessions = {};

// ✅ Test route to verify Railway works
app.get("/", (req, res) => {
  res.send("🚀 WhatsApp Bot is running!");
});

// ✅ Route to send your template
app.get("/send-template", (req, res) => {
  client.messages
    .create({
      from: "whatsapp:+14155238886", // replace with your Twilio WhatsApp number
      contentSid: process.env.TWILIO_TEMPLATE_SID,
      contentVariables: JSON.stringify({ "1": "Customer" }),
      to: "whatsapp:+919353984003" // replace with your test number
    })
    .then((message) => res.send("✅ Template sent: " + message.sid))
    .catch((err) => res.status(500).send(err.message));
});

// ✅ WhatsApp webhook
app.post("/whatsapp", (req, res) => {
  const twiml = new MessagingResponse();
  const from = req.body.From;
  const body = req.body.Body ? req.body.Body.trim() : "";

  if (!sessions[from]) {
    sessions[from] = { step: 1 };
    twiml.message("👋 Hello! Please enter your full name.");
  } else if (sessions[from].step === 1) {
    sessions[from].name = body;
    sessions[from].step++;
    twiml.message("📧 Thanks " + body + "! Please enter your email.");
  } else if (sessions[from].step === 2) {
    sessions[from].email = body;
    sessions[from].step++;
    twiml.message("📍 Great! Now enter your location.");
  } else {
    twiml.message("✅ Thank you! Your details have been saved.");
    delete sessions[from];
  }

  res.type("text/xml").send(twiml.toString());
});

// 🚀 Use Railway’s PORT instead of hardcoding
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Bot running on port ${PORT}`);
});

