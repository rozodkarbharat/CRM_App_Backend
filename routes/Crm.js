const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");

const CRMRoute = express.Router();

CRMRoute.get("/", (req, res) => {
   
  try {
    const token = req.headers.token.split(" ")[1];
    const { AMSID, Group_Name, Role } = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const offset = (page - 1) * pageSize;
    let query = "SELECT * FROM signup";
    if (Role === "Franchise") {
      query += ` WHERE Welcome = '${AMSID}'`;
    }

      if (searchQuery) {
      if (Role === "Franchise") {
        query += ` AND (Name LIKE '%${searchQuery}%' OR EmailID LIKE '%${searchQuery}%' OR Number LIKE '%${searchQuery}%' OR UserID LIKE '%${searchQuery}%')`;
      } else {
        query += ` WHERE (Name LIKE '%${searchQuery}%' OR EmailID LIKE '%${searchQuery}%' OR Number LIKE '%${searchQuery}%' OR UserID LIKE '%${searchQuery}%')`;
      }
    }

    query += ` LIMIT ${pageSize} OFFSET ${offset}`;

    connection.query(query, (error, results, fields) => {
      if (error) {
        console.log(err.message, "error")
        res
            .status(500)
            .json({ message: "Error getting CRM Users", error: true });
        return;
      }

      res.status(200).json({ data: results,error:false });
    });
  } catch (error) {
    console.log(err.message, "error")
      res.send({ message: err.message, error: true });
  }
});

module.exports = CRMRoute;
