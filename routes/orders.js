const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");


const ordertable = {
  UPSTOX: "upstox_orders",
  ANGEL: "orders",
  KOTAK:"kotak_orders",
  DHANHQ:"dhan_orders",
  FYERS: "fyers_orders",
}

const ordersRoute = express.Router();

ordersRoute.post("/today-orders", (req, res) => {
  
  try {
    let { startDate, endDate, selectedStrategy } = req.body
    const token = req.headers.token.split(" ")[1];
    var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    endDate = new Date(endDate).getTime() / 1000
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    endDate = endDate + oneDayInMillis / 1000
    startDate = new Date(startDate).toISOString().slice(0, 19).replace("T", " ");
    endDate = new Date(endDate * 1000).toISOString().slice(0, 19).replace("T", " ");
    let Query = `Select Broker from api where UserID = ? `
    connection.query(Query, [UserID], (err, result) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Error getting broker details", error: true });
        return;
      }
      if (result.length > 0) {
        let Broker = result[0].Broker;
        console.log(startDate, endDate, Broker, UserID)
        const todayDate = new Date().toISOString().slice(0, 10);
        let Query = ""
        if (selectedStrategy === "All") {
          Query = `SELECT * FROM ${ordertable[Broker]} WHERE UserID=? AND DateTime >= ? AND DateTime <= ?`
        }
        else {
          Query = `SELECT * FROM ${ordertable[Broker]} WHERE UserID=? AND DateTime >= ? AND DateTime <= ? AND Strategy=?`
        }
        connection.query(Query, [UserID, startDate, endDate, selectedStrategy], (err, result) => {
          if (err) {
            console.log(err.message)
            res
              .status(500)
              .json({ message: "Error getting orders", error: true });
            return;
          }
          if (result.length > 0) {
            res.status(200).send({ message: "Success", data: result, status: true });
          }
          else {
            res.status(200).send({ message: "No data Found", data: [], status: true })
          }
        })
      }
      else {
        res.status(200).send({ message: "No data Found", data: [], status: true })
      }

    })
  }
  catch (error) {
    res.status(500).send({ message: error.message, error: true });
  }
})


ordersRoute.get("/live-trades", (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    endDate = new Date().getTime() / 1000
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    endDate = endDate + oneDayInMillis / 1000
    endDate = new Date(endDate * 1000)

    let Query = `Select Broker from api where UserID = ? `
    connection.query(Query, [UserID], (err, result) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Error getting broker details", error: true });
        return;
      }
      if (result.length > 0 && Object.keys(ordertable).includes( result[0].Broker)) {      
        let Broker = result[0].Broker;
        let Query = `SELECT * FROM ${ordertable[Broker]} WHERE UserID=? AND DateTime >= ? AND DateTime <= ? AND Status=1`

        connection.query(Query, [UserID, startDate, endDate], (err, result) => {
          if (err) {
            console.log(err.message)
            res
              .status(500)
              .json({ message: "Error getting orders", error: true });
            return;
          }
          if (result.length > 0) {
            res.status(200).send({ message: "Success", data: result, status: true });
          }
          else {
            res.status(200).send({ message: "No data Found", data: [], status: true })
          }
        })
      }
      else {
        res.status(200).send({ message: "No data Found", data: [], status: true })
      }

    })
  }
  catch (error) {
    res.status(500).send({ message: error.message, error: true });
  }
})

module.exports = ordersRoute;