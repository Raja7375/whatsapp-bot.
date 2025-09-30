require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Store sessions
let sessions = {};

// WhatsApp webhook route
app.post("/whatsapp", (req, res) => {
  const from = req.body.From;
  const body = req.body.Body ? req.body.Body.trim() : "";
  const twiml = new MessagingResponse();

  if (!sessions[from]) {
    sessions[from] = { step: 1 };
    twiml.message("👋 Hello! Please enter your full name.");
  } else {
    const s = sessions[from];
    switch (s.step) {
      case 1:
        s.name = body;
        s.step++;
        twiml.message(`Thanks, ${s.name}. Please provide your phone number.`);
        break;
      case 2:
        s.phone = body;
        s.step++;
        twiml.message("Got it. Please share your email address.");
        break;
      case 3:
        s.email = body;
        s.step++;
        twiml.message("What type of lawyer are you looking for? (Immigration, Real Estate, Family, Personal Injury, Wills & Estates, Business, Litigation)");
        break;
      case 4:
        s.lawyerType = body;
        s.step++;
        twiml.message("When would you prefer us to contact you? (Morning, Afternoon, Evening, or specific time)");
        break;
      case 5:
        s.contactTime = body;
        s.step++;
        twiml.message(
          `Here’s what you entered:\n\nName: ${s.name}\nPhone: ${s.phone}\nEmail: ${s.email}\nLawyer: ${s.lawyerType}\nPreferred Time: ${s.contactTime}\n\nIs this correct? (Yes/No)`
        );
        break;
      case 6:
        if (body.toLowerCase() === "yes") {
          twiml.message("✅ Thank you. Our team will contact you shortly.");
        } else {
          twiml.message("❌ Let's start again. Please enter your full name.");
          sessions[from] = { step: 1 };
        }
        delete sessions[from];
        break;
      default:
        twiml.message("Thank you. Our team will follow up with you soon.");
        delete sessions[from];
    }
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// Railway uses dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot running on port ${PORT}`));
