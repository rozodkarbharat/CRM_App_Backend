const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const connection = require("../db");

const clientDetailRoute = express.Router();

clientDetailRoute.get("/single_user/:id", async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role, AMSID } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    const { id } = req.params;

    let query = `
        SELECT 
        s.Name AS Name, 
        s.UseriD AS UserID,
        s.EmailID AS Email, 
        s.Number AS Number, 
        s.DateTime AS SignupDateTime, 
        sub.Subcription AS Subcription, 
        sub.DateTime AS SubcriptionDateTime, 
        a.Broker AS Broker, 
        a.DateTime AS APIDateTime
    FROM 
        signup AS s
    LEFT JOIN 
        subcription AS sub ON s.UserID = sub.UserID
    LEFT JOIN 
        api AS a ON s.UserID = a.UserID
    WHERE 
        s.UserID = ?
        `;
    if (Role === "Franchise") {
      query += ` AND s.Welcome = ?`;
    }

    connection.query(query, [id, AMSID], (error, results) => {
      if (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      const userData = results[0];
      res.status(200).json({ data: userData, error: false });
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

clientDetailRoute.get("/subscribed_strategies/:id", async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role, AMSID } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    const { id } = req.params;

    let query = `
            SELECT 
                sub.Strategies AS Strategies,
                sub.DateTime AS SubscriptionDateTime,
                s.DateTime AS SignupDateTime,
                sub.Amount AS Amount
            FROM 
                subcription AS sub
            INNER JOIN 
                signup AS s ON sub.UserID = s.UserID
            WHERE 
                sub.UserID = ?
        `;

    if (Role === "Franchise") {
      query += ` AND s.Welcome = ?`;
    }

    connection.query(query, [id, AMSID], (error, results) => {
      if (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedResults = results.map((result) => {
        const startdateString = result.SubscriptionDateTime;
     
        const [datePart, timePart] = startdateString.split(" ");
        const [day, month, year] = datePart.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        newdate = new Date(date.setDate(date.getDate() + 45));
        EndDate = newdate.toLocaleDateString("en-GB");
        const formattedDateString = EndDate.replace(/\//g, '-')


        return {
            ...result,
            SubscriptionDateTime:startdateString.split(" ")[0],
            EndDate:formattedDateString
        };
    });
   
    

      res.status(200).json({ data: updatedResults, error: false });
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

clientDetailRoute.put("/update_api/:id", async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    const { Group_Name, Role } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    const { id } = req.params;
    const { Api_Key, Secret_Key, TOTP_Secret, Client_ID, Password, Broker } =
      req.body;

    let updateQuery;
    let queryParams;

    if (Broker === "UPSTOCK") {
      updateQuery = `
                UPDATE api
                SET Api_Key = ?, Secret_Key = ?, Broker = ? 
                WHERE UserID = ?
            `;
      queryParams = [Api_Key, Secret_Key, Broker, id];
    } else {
      updateQuery = `
                UPDATE api
                SET Api_Key = ?, Secret_Key = ?, TOTP_Secret = ?, Client_ID = ?, Password = ?, Broker = ? 
                WHERE UserID = ?
            `;
      queryParams = [
        Api_Key,
        Secret_Key,
        TOTP_Secret,
        Client_ID,
        Password,
        Broker,
        id,
      ];
    }

    connection.query(updateQuery, queryParams, (error, results) => {
      if (error) {
        console.log(error.message);
        return res
          .status(500)
          .json({ message: "Internal server error", error: true });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "User not found", error: true });
      }

      res
        .status(200)
        .json({ message: "API details updated successfully", error: false });
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

module.exports = clientDetailRoute;
