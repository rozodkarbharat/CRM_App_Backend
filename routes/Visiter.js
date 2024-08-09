const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");

const visitersRoute = express.Router();


function dateAndTime(){
  let date=new Date()
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

visitersRoute.post("/", async (req, res) => {
  try {
    let { Page,Ip,City } = req.body;
    const token = req.headers.token.split(" ")[1];
    let Userid="None"
    let DateTime = dateAndTime();
    
    if(token!=="None"){
      var { UserID } =  jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        Userid=UserID
    }

    if(!Ip){
      Ip = "None"
    }
    if(!City){
      City = "None"
    }

    console.log(DateTime, Userid,Ip, City, Page,"User")
    const sql =
      "INSERT INTO visiters (Page, Source, IP, DateTime,City) VALUES (?, ?, ?, ?,?)";
    connection.query(sql, [Page, Userid, Ip, DateTime,City], (err, result) => {
      if (err) {
        console.log(err.message)
        res
          .status(500)  
          .json({ message: "Error inserting visiter history", error: true });
        return;
      }
      res.json({ message: "visiter history saved successfully", error: false });
      return;
    });
  } catch (err) {
    console.log(err.message,"visiter history error")
    res.status(500).json({ message: "Unexpected error", error: true });
  }
});


visitersRoute.get("/upstox-account", async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    let Userid="None"
    // console.log(!token,"token")
    if(token){
      var { UserID } =  jwt.verify(token, process.env.TOKEN_SECRET_KEY);
      Userid=UserID
    }
    let DateTime = dateAndTime();
    console.log("hello", DateTime, Userid);


    console.log(DateTime, Userid,"upstox account opening")
    const sql =
      "INSERT INTO upstox_account ( UserID, DateTime) VALUES (?, ?)";
    connection.query(sql, [ Userid, DateTime], (err, result) => {
      if (err) {
        console.log(err.message)
        res
          .status(500)  
          .json({ message: "Error inserting upstox account", error: true });
        return;
      }
      // console.log(result,"result")
      res.json({ message: "data saved successfully", error: false });
      return;
    });
  } catch (err) {
    res.status(500).json({ message: "Unexpected error", error: true });
  }
});

module.exports = visitersRoute;
