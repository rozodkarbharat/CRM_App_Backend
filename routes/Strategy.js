const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");
const NodeCache = require( "node-cache" );


const childStrategies = {
    BankNifty_GOD:[
        "BankNifty_GOD_1_1","BankNifty_GOD_1_2","BankNifty_GOD_1_3","BankNifty_GOD_1_4",
        "BankNifty_GOD_3_1","BankNifty_GOD_3_2","BankNifty_GOD_3_3","BankNifty_GOD_3_4",
        "BankNifty_GOD_5_1","BankNifty_GOD_5_2","BankNifty_GOD_5_3","BankNifty_GOD_5_4",
        "BankNifty_GOD_15_1","BankNifty_GOD_15_2","BankNifty_GOD_15_3","BankNifty_GOD_15_4",
        "BankNifty_GOD"
    ],
    Nifty_GOD:[
        "Nifty_GOD_1_1","Nifty_GOD_1_2","Nifty_GOD_1_3","Nifty_GOD_1_4",
        "Nifty_GOD_3_1","Nifty_GOD_3_2","Nifty_GOD_3_3","Nifty_GOD_3_4",
        "Nifty_GOD_5_1","Nifty_GOD_5_2","Nifty_GOD_5_3","Nifty_GOD_5_4",
        "Nifty_GOD_15_1","Nifty_GOD_15_2","Nifty_GOD_15_3","Nifty_GOD_15_4",
        "Nifty_GOD"
    ],
    BNF_Bramhastra:["BNF_Bramhastra"],
    BNF: ["BNF"],
    Saturn: ["Saturn"],
    Candle_Master: ["Candle_Master"],
    UV5_BankNifty:[ "UV5_BankNifty"],
    UV5_Nifty:["UV5_Nifty"],
    Scalper_Master_Reverse: ["Scalper_Master_Reverse"],
    Scalper_Master: ["Scalper_Master"],
}


function dateAndTime() {
    let date = new Date()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

function executeQuery({ Query, data }) {
    return new Promise((resolve, reject) => {
        try {
            connection.query(Query, data, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        }
        catch (err) {
            reject(err);
        }
    });
}

function getSubscribedStrategies(result) {
    return new Promise((resolve, reject) => {
        try {
            let trial = false;
            let TrialDate = []
            let strategies = [];
            let dates = [];
            let premium = false;
            let subscriptiontype = "None"
            let data = []
            let trialData = []
            if (result.length > 0) {
                for (var a = 0; a < result.length; a++) {
                    if (result[a].Subcription === "Trial") {

                        let temp = 2
                        let StartDate = result[a].DateTime
                        const [datePart, timePart] = StartDate.split(' ');
                        const [day, month, year] = datePart.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        StartDate = date.toLocaleDateString("en-GB");
                        const weekday = date.toLocaleDateString("en-US", {
                            weekday: "short",
                        });
                        if (weekday === "Sat") {
                            temp += 2;
                        } else if (weekday === "Sun") {
                            temp += 1;
                        }
                        let newdate = new Date(date.setDate(date.getDate() + temp));
                        let remainingTime = newdate - new Date()
                        if (remainingTime > 0) {
                            trial = true
                        }
                    } else {
                        let strategy = result[a].Strategies.trim("");

                        strategy = strategy.slice(1, strategy.length - 1);
                        strategy = strategy.split(",");

                        premium = true;
                        strategies = [...strategies, ...strategy];

                        data.push({

                            strategies: strategy,
                        });
                    }

                }
            }
            subscriptiontype = premium ? "Premium" : trial ? "trial" : "None"
            let subscriptionDetails = data.length > 0 ? data : trialData
            let allStrategies = []
            if (subscriptiontype == "Premium") {
                allStrategies = subscriptionDetails.reduce((acc, subscription) => {
                    return acc.concat(subscription.strategies);
                }, []);
            }
            resolve({ subscriptiontype, allStrategies })
        }
        catch (err) {
            console.log(err.message, "error")
            reject({});
        }
    })
}

const myCache = new NodeCache();
const startegyRoute = express.Router();

startegyRoute.get("/live-running", function (req, res) {
    try {
        startDate = new Date()
        endDate = new Date(startDate).getTime() / 1000
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        endDate = endDate + oneDayInMillis / 1000
        endDate = new Date(endDate * 1000)
        let Query = `SELECT * FROM upstox_orders WHERE UserID = ? AND Strategy = ? AND Type='BUY' AND DateTime >= ? AND DateTime <= ? ORDER BY DateTime DESC LIMIT 1`
        connection.query(Query, ["Bha9096", "test", startDate, endDate], (error, results, fields) => {
            if (error) {
                res
                    .status(500)
                    .json({ message: "Unexpected error" + error.message, error: true });
                return;
            }
            if (results.length > 0) {
                res.status(200).json({ data: results, errors: false });
                return;
            }
            else {
                res.status(200).json({ data: [], errors: false });
                return;
            }
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Unexpected error" + err.message, error: true });
        return;
    }
});

startegyRoute.get("/running-bots/", async (req, res) => {
    try {
        const token = req.headers.token.split(" ")[1];
        var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

        let sql = "SELECT Script FROM running_bots WHERE UserID = ?";

        connection.query(sql, [UserID], (err, results) => {
            if (err) {
                res.status(500).json({ message: err.message, error: true });
                return;
            }
            if (results.length > 0) {
                // Data was retrieved
                res.status(200).json({ Data: results, error: false });
                return;
            } else {
                // No data found for the provided UserID
                res.status(200).json({ Data: [], error: false });
                return;
            }
        });
    } catch (error) {
        res.send({ message: error.message, error: true });
    }
});


startegyRoute.post("/toggle-bot", async (req, res) => {
    try {
        const token = req.headers.token.split(" ")[1];
        const { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        const { Script, Qty, Broker } = req.body;
        const scriptArray = childStrategies[Script];
        if (!scriptArray) {
            return res.status(404).json({ message: `Script ${Script} not found`, error: true });
        }

        let sql = "SELECT * FROM running_bots WHERE Script IN (?) AND UserID = ?";
        connection.query(sql, [scriptArray, UserID], (err, results) => {
            if (err) {
                return res.status(500).json({ message: err.message, error: true });
            }

            if (results.length > 0) {
                sql = "DELETE FROM running_bots WHERE Script IN (?) AND UserID = ?";
                connection.query(sql, [scriptArray, UserID], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message, error: true });
                    }

                    if (result.affectedRows > 0) {
                        // Rows were deleted
                        const insertData = scriptArray.map(script => ({
                            Service: "OFF",
                            UserID: UserID,
                            date_Time: dateAndTime(), // Current date and time
                            Script: script
                        }));

                        connection.query(
                            "INSERT INTO bot_history (Service, UserID, date_Time, Script) VALUES ?",
                            [insertData.map(data => [data.Service, data.UserID, data.date_Time, data.Script])],
                            (err, result) => {
                                if (err) {
                                    console.error("Error inserting bot history data:", err);
                                    return res.status(500).json({ message: err.message, error: true });
                                }
                            }
                        );
                        return res.status(200).json({
                            message: "Bots turned off",
                            isAdded: false,
                            error: false,
                        });
                    } else {
                        return res.status(404).json({ message: "Scripts are not turned off", error: false });
                    }
                });
            } else {
                let Orders = 0;
                if (Broker === "DEMO") {
                    Orders = 2;
                }
                const values = scriptArray.map(script => [script, UserID, Qty, Orders]);
                sql = "INSERT INTO running_bots (Script, UserID, Qty, Orders) VALUES ?";
                connection.query(sql, [values], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: err.message, error: true });
                    }
                    const insertData = scriptArray.map(script => ({
                        Service: "ON",
                        UserID: UserID,
                        date_Time: dateAndTime(), // Current date and time
                        Script: script
                    }));
                    connection.query(
                        "INSERT INTO bot_history (Service, UserID, date_Time, Script) VALUES ?",
                        [insertData.map(data => [data.Service, data.UserID, data.date_Time, data.Script])],
                        (err, result) => {
                            if (err) {
                                console.error("Error inserting bot history data:", err);
                                return res.status(500).json({ message: err.message, error: true });
                            }
                        }
                    );
                    return res.status(200).json({ message: "Bots turned on", isAdded: true, error: false });
                });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true });
    }
});

startegyRoute.get("/byStrategyName/:Name", (req, res) => {
    try {

        const Name = req.params.Name;
        let data=myCache.get(Name)
        if(data){
            res.status(200).send({ data, error: false });
            return;
        }
        else{
            let sql = "SELECT * FROM information WHERE Name = ? ";
            connection.query(sql, [Name], (err, results) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error getting Strategies data", error: true });
                }
                myCache.set(Name, results[0],86400)
                res.status(200).send({ data: results[0], error: false });
            });
        }
    } catch (error) {
        res.send({ message: error.message, error: true });
    }
});


startegyRoute.get("/:Type", async (req, res) => {
    try {
        const Type = req.params.Type;
        const token = req.headers.token.split(" ")[1];
        const { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

        let Query = "";
        let data = [];

        if (Type === "private") {
            Query = 'SELECT * FROM information WHERE Owner = "Private"';
            const infoResults = await executeQuery({ Query });
            res.status(200).json({ data: infoResults, errors: false });
            return;
        } else if (Type === 'all') {
            let data=myCache.get('all');
            if (data) {
                res.status(200).json({ data: data, errors: false });
                return;
            }
            else{
                Query = 'SELECT * FROM information WHERE Owner != "Private"';
                const infoResults = await executeQuery({ Query });
                myCache.set('all',infoResults)
                res.status(200).json({ data: infoResults, errors: false });
                return;
            }
        } else if (Type === "my") {
            const currentDate = new Date();
            const expireDate = new Date(currentDate);
            expireDate.setDate(currentDate.getDate() - 45);
            const formattedExpireDate = expireDate.toISOString().slice(0, 19).replace("T", " ");

            Query = `
                SELECT * FROM subcription
                WHERE STR_TO_DATE(DateTime, '%d-%m-%Y') >= ?
                AND UserID = ?`;

            data = [formattedExpireDate, UserID];

            const results = await executeQuery({ Query, data });
            if (results.length > 0) {
                // Process result data
                const { subscriptiontype, allStrategies } = await getSubscribedStrategies(results);

                // Depending on subscription type, fetch data from the information table
                let query = "";
                if (subscriptiontype === "Premium") {
                    query = `SELECT * FROM information WHERE Name IN (${allStrategies.map(name => connection.escape(name)).join(', ')})`;
                } else if (subscriptiontype === "trial") {
                    query = "SELECT * FROM information WHERE Owner != 'Private'";
                }

                if (query) {
                    const infoResults = await executeQuery({ Query: query });
                    res.status(200).json({ data: infoResults, errors: false });
                    return;
                }
                else {
                    res.status(200).json({ data: [], errors: false });
                    return;
                }
            }
            else {
                res.status(200).json({ data: [], errors: false });
                return;
            }

        } else {
            res.status(200).json({ data: [], errors: false });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Unexpected error" + error.message, error: true });
    }
});






module.exports = startegyRoute;