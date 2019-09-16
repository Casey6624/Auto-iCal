const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cheerio = require("cheerio");

const simpleParser = require("mailparser").simpleParser;

const app = express();

const Imap = require("imap"),
  inspect = require("util").inspect;

let buffer = "";
let myMap;

var imap = new Imap({
  user: process.env.EMAIL_USR,
  password: process.env.EMAIL_PASS,
  host: process.env.EMAIL_SMTP, //this may differ if you are using some other mail services like yahoo
  port: 993,
  tls: true,
  connTimeout: 10000, // Default by node-imap
  authTimeout: 5000, // Default by node-imap,
  debug: console.log, // Or your custom function with only one incoming argument. Default: null
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib.
  attachments: true, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
});

// Recieving Mail

function openInbox(cb) {
  imap.openBox("INBOX", true, cb);
}

imap.once("ready", function() {
  openInbox(function(err, box) {
    if (err) throw err;
    //console.log(box.messages.total + " message(s) found!");
    // 1:* - Retrieve all messages
    // 3:5 - Retrieve messages #3,4,5
    var f = imap.seq.fetch("1:1", {
      bodies: ""
    });
    f.on("message", function(msg, seqno) {
      //console.log("Message #%d", seqno);
      var prefix = "(#" + seqno + ") ";

      msg.on("body", function(stream, info) {
        // use a specialized mail parsing library (https://github.com/andris9/mailparser)
        simpleParser(stream, (err, mail) => {
          //console.log(prefix + mail.subject);
          const appointments = [];
          //console.log(prefix + mail.text);
          let $ = cheerio.load(mail.html.trim());
          $("tr").each(function(i, el) {
            let appointment = $(this)
              .find("td")
              .text()
              .trim();
            appointments.push(appointment);
          });
          console.log("length: " + appointments.length);
          //console.log(rows[0].trim());
        });

        // or, write to file
        //stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
      });
      msg.once("attributes", function(attrs) {
        //console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
      });
      msg.once("end", function() {
        //console.log(prefix + "Finished");
      });
    });
    f.once("error", function(err) {
      //console.log("Fetch error: " + err);
    });
    f.once("end", function() {
      //console.log("Done fetching all messages!");
      imap.end();
    });
  });
});

imap.once("error", function(err) {
  //console.log(err);
});

imap.once("end", function() {
  console.log("Connection ended");
});

imap.connect();

// Sending Mail

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
