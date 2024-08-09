const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");

let Strategies = {
  "UV Special": ["UV5_Nifty", "UV5_BankNifty"],
  Private: ["Scalper_Master_Reverse", "`Scalper_Master"],
  "Money Makers": ["Candle_Master", "Saturn","bnf_bramhastra_trades"],
  "Mint International": ["BNF"],
  All: ["UV5_Nifty", "UV5_BankNifty", "Candle_Master", "Saturn", "BNF","bnf_bramhastra_trades"],
};

let trade_tables = {
  BNF_Bramhastra:"bnf_bramhastra_trades",
  BNF: "trades",
  Saturn: "saturn_trades",
  Candle_Master: "candle_master_trades",
  UV5_BankNifty: "rsi_trades_5m",
  UV5_Nifty: "rsi_nifty_trades_5m",

  Scalper_Master_Reverse: "scalper_master_reverse",
  Scalper_Master: "scalper_master",

  All: [
    "bnf_bramhastra_trades",
    "trades",
    "saturn_trades",
    "candle_master_trades",
    "rsi_trades_5m",
    "rsi_nifty_trades_5m",
  ],
};

const strategiesRoute = express.Router();

strategiesRoute.get("/strategies-table", (req, res) => {
  
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role, AMSID} = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );
 
    if (Role === "Master_Admin" || Role === "Franchise") {
     
      connection.query(
        "SELECT * FROM information",
        (error, results, fields) => {
          if (error) {
            return res
              .status(400)
              .json({ message: "error getting strategies", error: true });
          }

          res.status(200).json({ data: results, error: false,AMSID });
        }
      );
    } else if (Role === "Creator" && Strategies[Group_Name]) {
      const sqlQuery = `SELECT * FROM information WHERE Owner = ?`;

      connection.query(sqlQuery, [Group_Name], (error, results, fields) => {
        if (error) {
          return res
            .status(400)
            .json({ message: "error getting strategies", error: true });
        }
       
        res.status(200).json({ data: results, error: false,AMSID});
      });
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  } catch (error) {
    console.log(error.message, "error");
    res.send({ message: error.message, error: true });
  }
});

strategiesRoute.put("/toggle-status", (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    if (Role === "Master_Admin" || Role === "Franchise" || (Role === "Creator" && Strategies[Group_Name])) {
      const { Name,  Status } = req.body;
      const newStatus =  Status === "ON"?"OFF":"ON"
     

      if (!Name || !Status) {
       
        return res.status(400).json({ message: "Name and Status are required", error: true });
      }

      let sqlQuery;
      let sqlParams;

      if (Role === "Master_Admin") {
        
        sqlQuery = `UPDATE information SET Status = ? WHERE Name = ?`;
        sqlParams = [newStatus, Name];
      } else {
        
        sqlQuery = `UPDATE information SET Status = ? WHERE Name = ? AND Owner = ?`;
        sqlParams = [newStatus, Name, Group_Name];
      }

    
      connection.query(sqlQuery, sqlParams, (error, results, fields) => {
        if (error) {
          return res.status(400).json({ message: "Error updating Status", error: true });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: "Strategy not found or access denied", error: true });
        }
        res.status(200).json({ message: "Status updated successfully", error: false });
      });
    } else {
      res.status(403).json({ message: "Access denied",error:true });
    }
  } catch (error) {
    console.log(error.message, "error");
    res.status(500).json({ message: error.message, error: true });
  }
});

strategiesRoute.put("/strategies-edit", (req, res) => {
 
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    if (Role === "Master_Admin" || Role === "Franchise" || (Role === "Creator" && Strategies[Group_Name])) {
      const { Name, Description } = req.body;
      
      if (!Name || !Description) {
        return res.status(400).json({ message: "Name and Description are required", error: true });
      }

      let sqlQuery;
      let sqlParams;

      if (Role === "Master_Admin") {
        
        sqlQuery = `UPDATE information SET Description = ? WHERE Name = ?`;
        sqlParams = [Description, Name];
      } else {
        
        sqlQuery = `UPDATE information SET Description = ? WHERE Name = ? AND Owner = ?`;
        sqlParams = [Description, Name, Group_Name];
      }

     
    
      connection.query(sqlQuery, sqlParams, (error, results, fields) => {
        if (error) {
          return res.status(400).json({ message: "Error updating strategy", error: true });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: "Strategy not found or access denied", error: true });
        }
        res.status(200).json({ message: "Strategy updated successfully", error: false });
      });
    } else {
      res.status(403).json({ message: "Access denied",error:true });
    }
  } catch (error) {
    console.log(error.message, "error");
    res.status(500).json({ message: error.message, error: true });
  }
});


strategiesRoute.get("/strategies-last-ten-trads", (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );
    const strategyName = req.query.strategy;

    if (trade_tables[strategyName]) {
      const tableName = trade_tables[strategyName];
    
      const sqlQuery = `SELECT * FROM ${tableName} ORDER BY DateTime DESC LIMIT 20`;

      connection.query(sqlQuery, (error, results, fields) => {
        if (error) {
          return res
            .status(400)
            .json({ message: "error getting last ten trads", error: true });
        }
        res.status(200).json({ data: results, error: false });
      });
    } else {
      res.status(400).json({ message: "Invalid strategy name", error: true });
    }
  } catch (error) {
    console.log(error.message, "error");
    res.send({ message: error.message, error: true });
  }
});

module.exports = strategiesRoute;
