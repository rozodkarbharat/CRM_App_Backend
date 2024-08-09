const express = require('express')
var jwt = require("jsonwebtoken");
require("dotenv").config();


function sendSMS(Number, OTP) {
    console.log(OTP, Number,"OTP")
    return new Promise(async(resolve, reject)=> {
        
    const url = `http://login.swarajinfotech.com/domestic/sendsms/bulksms_v2.php?apikey=Vml2ZWtvdHA6OFljNEhDeHo=&type=TEXT&sender=NSLSMS&entityId=1201164562188563646&templateId=1207170323851947619&mobile=${Number}&message=Dear%20user%2C%20the%20OTP%20for%20${OTP}%20for%20Money%20Makers%20NSL%20LIFE`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                reject("error")
            }
            return response.text()

        }).then((data)=>{
            resolve(data)
        })
        .catch(error => {
            console.log(error.message,"error msg")
            reject("error");
        });
    })
}

const connection = require('../db');

const userRoute = express.Router()

let OtpObj={}

userRoute.post("/login", (req, res) => {
    try {
        const { Number, Password } = req.body;
        let Query = `SELECT * FROM signup WHERE Number = '${Number}' AND Password = '${Password}'`;

        connection.query(Query, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: "Error getting user details", error: true });
                return;
            }
            if (result.length > 0) {
                var Token = jwt.sign({ UserID: result[0].UserID }, process.env.TOKEN_SECRET_KEY);

                res.status(200).send({ Message: "Login Successfully", Token, data: result.data, error: false });
                return;
            }
            else {
                res.status(200).send({ Message: "Invalid Credentials", Token, data: result.data, error: false });
                return;
            }
        })
    }
    catch (err) {
        console.log(err.message,"error")
        res.status(500).json({ message: "Unexpected error", error: true });
        return;
    }
})

userRoute.post("/signup", (req, res) => {
    try {
        const { Name,EmailID,Password,Number,referral } = req.body;
        let DateTime = new Date()
        let UserID = `${Name.slice(0, 3)}${Number.toString().slice(0, 3)}`;
        const Query = 'INSERT INTO signup (Name, Password, EmailID, Number, Welcome, DateTime,UserID, EmailVerified) VALUES (?, ?, ?, ?, ?, ?,?,0)';

        connection.query(Query,[ Name, Password ,EmailID,Number,referral,DateTime,UserID,0], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: "Error adding user details", error: true });
                return;
            }
            var Token = jwt.sign({ UserID}, process.env.TOKEN_SECRET_KEY);
            res.send({message:"Signup successful",Token,error: false});
        })
    }
    catch (err) {
        console.log(err.message,"error")
        res.status(500).json({ message: "Unexpected error", error: true });
        return;
    }
})


userRoute.get("/details", (req, res) => {
    try {
        const token = req.headers.token.split(" ")[1];
        var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        const Query = `
        SELECT signup.*, api.UserID AS user, api.Broker AS Broker
        FROM signup
        LEFT JOIN api ON signup.UserID = api.UserID
        WHERE signup.UserID = ?`;
        connection.query(Query, [UserID], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: "Error getting user details", error: true });
                return;
            }
            if (result.length > 0) {

                res.status(200).send({ Message: "success", data: result[0], error: false });
                return
            }
            else {
                res.status(200).send({ Message: "Data Not Found", data: [], error: false });
            }
        })
    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})

userRoute.post("/reset-password", function(req, res) {
    try{
        const Password = req.body.Password
        const token = req.headers.token.split(" ")[1];
        var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        let Query="UPDATE signup SET Password=? WHERE UserID=?"
        connection.query(Query,[Password,UserID],function(err,result){
            if (err) {
                console.error(err);
                res.status(500).json({ message: "Error changing Password", error: true });
                return;
            }
            res.status(200).json({ message: "Password changed successfully", error: false });
        })

    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})

userRoute.get('/voucher_code_ref', async (req, res) => {
    try {
        const token = req.headers.token.split(' ')[1];
        const { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
 
        const query = `
            SELECT vc.Voucher_Code,vc.Amount
            FROM signup s
            JOIN voucher_code vc ON s.welcome = vc.AMSID
            WHERE s.UserID = ?
              AND vc.Quantity > 0;
        `;
  
        const values = [UserID];
  
        connection.query(query, values, (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }
  
            if (results.length > 0) {
                res.status(200).json({error:false, data:results});
            } else {
                res.status(200).json({error:false, data: [] });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

userRoute.post("/get-otp",async(req, res)=>{
    try{
        let {Number}=req.body
        let OTP = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        OtpObj[Number] =OTP
       let response= await sendSMS(Number, OTP)
       let result=response.split(" | ")

       if(result[0]==="SUCCESS"){
            res.status(200).json({ message: "OTP sent to mobile number",OTP, error: false })
        }
        else{
            res.status(200).json({ message: "Something went wrong, Please try again", error: false })
        }
    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Something went wrong, Please try again", error: true });
    }
})


userRoute.post("/verify-otp",(req, res)=>{
    try{
        const {OTP,Number}=req.body
        if(OtpObj[Number.toString()]==OTP){
            delete OtpObj[Number.toString()]
            res.status(200).send({Message:"OTP Verified",OtpVerified:true,error:false});
        }
        else{
            res.status(200).send({Message:"Wrong Otp",OtpVerified:false,error:false});
        }
    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})


userRoute.get("/after-otp/:Number", function(req, res) {
    try{
        let Number=req.params.Number
        const query = 'SELECT * FROM signup WHERE Number = ?';
        connection.query(query, [Number], (error, results) => {
          if (error) {
            res.status(500).json({ message: "Unexpected error", error: true });
            return;
          }
          if (results.length > 0) {
            var Token = jwt.sign({ UserID: results[0].UserID }, process.env.TOKEN_SECRET_KEY);

            res.status(200).send({ Message: "Login Successfully", Token, data: results.data, error: false });
            return;
        }
        else {
            res.status(200).send({ Message: "Invalid Credentials", Token, data: results.data, error: false });
            return;
        }
        })
    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})

userRoute.get("/:Number", function(req, res) {
    try {
        let Number=req.params.Number
        const query = 'SELECT COUNT(*) AS count FROM signup WHERE Number = ?';
        connection.query(query, [Number], (error, results) => {
          if (error) {
            res.status(500).json({ message: "Unexpected error", error: true });
            return;
          }
          const count = results[0].count;
          res.status(200).json({ count, error: false });
          return;
        })
    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})

userRoute.post("/firebase-token", (req, res) => {
    try {
      const token = req.headers.token.split(" ")[1];
      const { firebaseToken } = req.body;
      const { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  
       
      const selectQuery = `SELECT * FROM firetoken WHERE UserID = ?`;
      connection.query(selectQuery, [UserID], (err, result) => {
        if (err) {
          console.error("Error selecting Firebase token from database:", err);
          return res.status(500).send("Internal Server Error");
        }
  
        if (result.length >= 1) {
          
          const updateQuery = `UPDATE firetoken SET FirebaseToken = ? WHERE UserID = ?`;
          connection.query(updateQuery, [firebaseToken, UserID], (err, result) => {
            if (err) {
              console.error("Error updating Firebase token in database:", err);
              return res.status(500).send("Internal Server Error");
            }
            console.log("Firebase token updated successfully.");
            res.status(200).send("Firebase token updated successfully.");
          });
        } else {
         
          const insertQuery = `INSERT INTO firetoken (UserID, FirebaseToken) VALUES (?, ?)`;
          connection.query(insertQuery, [UserID, firebaseToken], (err, result) => {
            if (err) {
              console.error("Error inserting new Firebase token into database:", err);
              return res.status(500).send("Internal Server Error");
            }
            console.log("New Firebase token inserted successfully.");
            res.status(200).send("New Firebase token inserted successfully.");
          });
        }
      });
    } catch (error) {
      console.error("Error in firebase-token route:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  


module.exports = userRoute