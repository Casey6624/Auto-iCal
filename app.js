const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");

const simpleParser = require("mailparser").simpleParser;

const app = express();

let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP,
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USR,
    pass: process.env.EMAIL_PASS
  }
});

function sendMail() {
  var mailOptions = {
    from: process.env.EMAIL_USR,
    to: "casey@jollyit.co.uk",
    subject: `iCal Completed`,
    text: "Find Your iCal Attached"
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

app.get("/ical", (req, res, next) => {
  sendMail();
});

app.listen(5000);
