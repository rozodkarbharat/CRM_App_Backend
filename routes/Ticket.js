const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");




const ticketRoute = express.Router();

ticketRoute.post('/add', (req, res) => {
    try {
        const { Message } = req.body
        const token = req.headers.token.split(" ")[1];
        var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

        let Query = "INSERT INTO tickets (Message, DateTime, UserID, Status) VALUES (?,?,?,?)"
        connection.query(Query, [Message, new Date(), UserID, "Pending"], (err, result) => {
            if (err) {
                console.log(err.message)
                res
                    .status(500)
                    .json({ message: "Error inserting ticket", error: true });
                return;
            }
            console.log(result.affectedRows, "Success")
            if (result.affectedRows > 0) {
                res.status(201).json({ message: "Ticket submitted successfully", error: false })
                return;
            }
        })

    }
    catch (err) {
        console.log(err.message, "error mesage");
        res.status(500).json({ message: "Unexpected error", error: true });
    }
})

module.exports = ticketRoute;