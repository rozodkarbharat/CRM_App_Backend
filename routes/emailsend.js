const nodemailer = require("nodemailer");
require("dotenv").config();


const mailSender = async({email,subject,body})=>{
    try {

console.log(email);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 465,
            auth: {
              user: "dipanshuverma585@gmail.com",
              pass: "njqa btnf giiy bkcc",
            },
          });

          const mailOptions = {
            // from: "brr9096005866@gmail.com",
            from: '"Money Makers Algo" <support@moneymakers-algo.com>',
            to:email,
            subject,
            html:"hii"
          };
         
          const info = await transporter.sendMail(mailOptions);

          console.log("Email sent:", info);
          return { error: false, message: "Email sent: " + info.messageId };

        
    } catch (error) {
        console.error("Error sending email:", error);
        return { error: true, message: error.message };
    }
}

module.exports  = mailSender