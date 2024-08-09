const { Router } = require("express");
 
const nodemailer = require("nodemailer");
const connection = require("../db");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    auth: {
      user: "support@moneymakers-algo.com",
      pass: "MoneyMakers@A1B2",
    },
  });



const verifyEmailRoute = Router();

verifyEmailRoute.post("/email_verify", async(req, res) => {
  try {
    const { email,Name } = req.body;
    const subject = "Verify Your Email Address";
 
    const body = `<html>
    <head>
        <style>
        body {
            background-color: #f9f9f9;
            padding-right: 10px;
            padding-left: 10px;
          }
          .content {
            background-color: #ffffff;
            border-color: #e5e5e5;
            border-style: solid;
            border-width: 0 1px 1px 1px;
            max-width: 600px;
            width: 100%;
            height: 300px;
            margin-top: 60.5px;
            margin-bottom: 31px;
            border-top: solid 3px #8e2de2;
            border-top: solid 3px -webkit-linear-gradient(to right, #8e2de2, #4a00e0);
            border-top: solid 3px -webkit-linear-gradient(to right, #8e2de2, #4a00e0);
            text-align: center;
            padding: 60px 0px 0px;
          }
          h1 {
            padding-bottom: 5px;
            color: #000;
            font-family: Poppins,Helvetica,Arial,sans-serif;
            font-size: 28px;
            font-weight: 400;
            font-style: normal;
            letter-spacing: normal;
            line-height: 36px;
            text-transform: none;
            text-align: center;
          }
          h2 {
            margin-bottom: 30px;
            color: #999;
            font-family: Poppins,Helvetica,Arial,sans-serif;
            font-size: 16px;
            font-weight: 300;
            font-style: normal;
            letter-spacing: normal;
            line-height: 24px;
            text-transform: none;
            text-align: center;
          }
          p {
            font-size: 14px;
            margin: 0px 21px;
            color: #666;
            font-family: 'Open Sans',Helvetica,Arial,sans-serif;
            font-weight: 300;
            font-style: normal;
            letter-spacing: normal;
            line-height: 22px;
            margin-bottom: 40px;
          }
          .btn-primary {
            background: #7071e8;
            border: none;
            font-family: Poppins,Helvetica,Arial,sans-serif;
            font-weight: 200;
            font-style: normal;
            letter-spacing: 1px;
            text-transform: uppercase;
            text-decoration: none;
            padding:10px 5px;
            border-radius:5px;
          }
    
          a {
            color:white;
            text-decoration: underline;
          }
          .color_span{
            color:white;
          }
          .did_get{
            test-align:center;
          }
        </style>
    </head>
    <body>
    <div class="d-flex align-items-center justify-content-center">
    <div class="content">
      <h1>Hello, ${Name}!</h1>
      <h2>Verify Your Email Account</h2>
      <p>Thanks for creating your account on our platform! Please click on confirm button to validate your account.</p>
      <a href="http://localhost:8000/verify-email" target="_blank" class="btn btn-primary btn-lg" type="button">  <span class="color_span">Confirm Email </span></a>
    </div>
  </div>
  <div class="d-flex align-items-center justify-content-center">
  <p class="did_get">If you didn't request this, you can safely ignore this email.</p>
  </div>
    </body>
    </html>`;

      const mailOptions = {
        from: '"Money Makers Algo" <support@moneymakers-algo.com>',
        to:email,
        subject,
        html:body
      };
      

      const info = await transporter.sendMail(mailOptions);   
      res.status(200).json({ error: false, message: "Email sent: " + info.messageId });
   
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
});

verifyEmailRoute.get("/email_status", (req,res)=>{
   try {
const token  = req.headers.token.split(" ")[1]
 
    const {UserID}  =  jwt.verify(token,process.env.TOKEN_SECRET_KEY)
    console.log(UserID);
    const updateQuery = "UPDATE signup SET EmailVerified = 1 WHERE UserID = ?";
    connection.query(updateQuery, [UserID], (error, results) => {
      if (error) {
        console.error("Error updating EmailVerified:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
      }
      console.log(results);
      console.log("EmailVerified updated successfully");
      return res.status(200).json({ success: true, message: "Signup successful" });
    });
    
   } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: true, message: error.message });
   } 
})


module.exports = verifyEmailRoute;
