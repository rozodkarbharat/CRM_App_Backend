const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken"); 3
const NodeCache = require( "node-cache" );

let trade_tables = {
    Nifty_GOD:[
        "nifty_rsi_opening_trade_1m",
        "nifty_rsi_opening_trade_3m",
        "nifty_rsi_opening_trade_5m",
        "nifty_rsi_opening_trade_15m"
    ],
     BankNifty_GOD:[
        "rsi_opening_trade_1m",
        "rsi_opening_trade_3m",
        "rsi_opening_trade_5m",
        "rsi_opening_trade_15m"
    ],
    
    BNF_Bramhastra:["bnf_bramhastra_trades"],
    BNF: ["trades"],
    Saturn: ["saturn_trades"],
    Candle_Master: ["candle_master_trades"],
    UV5_BankNifty:[ "rsi_trades_5m"],
    UV5_Nifty:["rsi_nifty_trades_5m"],
    
    Scalper_Master_Reverse: ["scalper_master_reverse"],
    Scalper_Master: ["scalper_master"],
    
    All: [
      "trades",
      "saturn_trades",
      "candle_master_trades",
      "rsi_trades_5m",
      "rsi_nifty_trades_5m",
      "bnf_bramhastra_trades",
      "nifty_rsi_opening_trade_1m",
      "nifty_rsi_opening_trade_3m",
      "nifty_rsi_opening_trade_5m",
      "nifty_rsi_opening_trade_15m",
      "rsi_opening_trade_1m",
      "rsi_opening_trade_3m",
      "rsi_opening_trade_5m",
      "rsi_opening_trade_15m"
    ],
};

let trade_table = {
    Nifty_GOD: [
        "nifty_rsi_opening_trade_1m",
        "nifty_rsi_opening_trade_3m",
        "nifty_rsi_opening_trade_5m",
        "nifty_rsi_opening_trade_15m"
    ],

    BankNifty_GOD: [
        "rsi_opening_trade_1m",
        "rsi_opening_trade_3m",
        "rsi_opening_trade_5m",
        "rsi_opening_trade_15m",
    ],

    BNF_Bramhastra: ["bnf_bramhastra_trades"],
    BNF: ["trades"],
    Saturn: ["saturn_trades"],
    Candle_Master: ["candle_master_trades"],
    UV5_BankNifty: ["rsi_trades_5m"],
    UV5_Nifty: ["rsi_nifty_trades_5m"],

    Scalper_Master_Reverse: ["scalper_master_reverse"],
    Scalper_Master: ["scalper_master"],
    BankNifty_GOD: ["rsi_opening_trade_1m",
        "rsi_opening_trade_3m",
        "rsi_opening_trade_5m",
        "rsi_opening_trade_15m"],
    Nifty_GOD: ["nifty_rsi_opening_trade_1m",
        "nifty_rsi_opening_trade_3m",
        "nifty_rsi_opening_trade_5m",
        "nifty_rsi_opening_trade_15m",],
    All: [
        "trades",
        "saturn_trades",
        "candle_master_trades",
        "rsi_trades_5m",
        "rsi_nifty_trades_5m",
        "bnf_bramhastra_trades",
        "nifty_rsi_opening_trade_1m",
        "nifty_rsi_opening_trade_3m",
        "nifty_rsi_opening_trade_5m",
        "nifty_rsi_opening_trade_15m",
        "rsi_opening_trade_1m",
        "rsi_opening_trade_3m",
        "rsi_opening_trade_5m",
        "rsi_opening_trade_15m"
    ],
};

function mixAllData({ data }) {
    return new Promise(function (resolve, reject) {
        try {

            let Data = []
            for (var a = 0; a < data.length; a++) {
                Data = [...Data, ...data[a]]
            }

            resolve(Data);
        }
        catch (err) {
            reject(err);
        }
    })
}

function singleStrategyTradeHistory({ Strategy, startDate, endDate }) {
    return new Promise(function (resolve, reject) {
        try {
            startDate = new Date(startDate);
            endDate = new Date(endDate).getTime() / 1000
            const oneDayInMillis = 24 * 60 * 60 * 1000;
            endDate = endDate + oneDayInMillis / 1000
            endDate = new Date(endDate * 1000)
            const sql = `SELECT * FROM ${trade_tables[Strategy]} WHERE DateTime >= ? AND DateTime <= ?`;

            connection.query(sql, [startDate, endDate], (err, results) => {
                if (err) {
                    console.log(err.message, "error")
                    reject(err);
                    return;
                }
                resolve(results)

                return;
            });
        }
        catch (err) {
            reject(err);
        }
    })
}

const tradesRoute = express.Router();
const myCache = new NodeCache();


tradesRoute.post("/strategywise-trade-history", async function (req, res) {
    try {
        const Strategy = req.body.selectedStrategy;
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;

        let result = await singleStrategyTradeHistory({ Strategy, startDate, endDate })

        if (result.length > 0) {
            res.status(200).json({ data: result, error: false });
        }
        else {
            res.status(200).json({ data: [], error: false });
        }
    } catch (err) {
        res.status(500).json({ message: "Unexpected error" + err.message, error: true });
    }
});

tradesRoute.get("/candle/:strategy", async function (req, res) {
    const Strategy = req.params.strategy;
    try {
        let data = myCache.get(`candle_${Strategy}`)
        if (data) {
            res.status(200).json({ data, error: false });
        }
        else {

            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            let formattedDate = tenDaysAgo.toISOString().split("T")[0];

            let sql = `
            SELECT *
            FROM (
              SELECT *
              FROM ??
              ORDER BY DateTime DESC
              LIMIT 26
            ) AS last_26_trades
            ORDER BY DateTime ASC`;

         const sqlPromises =  trade_tables[Strategy].map((strategy)=>{
            return new Promise((resolve, reject) => {
                connection.query(sql, [strategy,formattedDate], (err, results) => {
                    if (err) {
                        reject(err)
                       
                    }else{
                        resolve(results);
                    }
                
                });
            })
         })
         const sqlresults = await Promise.all(sqlPromises);

         const rejectedPromise = sqlresults.find(promise => promise.status === 'rejected');
         if (rejectedPromise) {
            res.status(500).json({
                message: "Error gettting trade history data",
                Strategy: trade_tables[Strategy],
                error: true,
            });
            return;
         }
        
    
         myCache.set(`candle_${Strategy}`, sqlresults.flat(), 86400)
        res.status(200).json({ data: sqlresults.flat(), error: false });
            
                 
                 
        }
    } catch (err) {
        res
            .status(500)
            .json({ message: "Unexpected error" + err.message, error: true });
    }
});

tradesRoute.post("/all", (req, res) => {
    try {
        let { startDate, endDate,selectedStrategy } = req.body
        startDate = new Date(startDate)
        endDate = new Date(endDate).getTime() / 1000
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        endDate = endDate + oneDayInMillis / 1000
        endDate = new Date(endDate * 1000)
        function executeQuery(query, params) {
            return new Promise((resolve, reject) => {
                connection.query(query, params, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        async function executeQueriesAndCombineResults(Strategy) {
            let results = [];
            for (const table of trade_table[Strategy]) {
                const query = `
          SELECT *
          FROM ${table}
          WHERE DateTime >= ? AND DateTime <= ?
          ORDER BY DateTime ASC
        `;

                try {
                    const queryResult = await executeQuery(query, [startDate, endDate]);
                    results.push(queryResult);
                } catch (err) {
                    res
                        .status(500)
                        .json({ message: "Error gettting all trades history data" + err.message, error: true });
                    return;
                }
            }
            results = await mixAllData({ data: results })
            res.status(200).send({ data: results, errors: false })
            return;

        }
        executeQueriesAndCombineResults(selectedStrategy);
    } catch (err) {
        res
            .status(500)
            .json({ message: "Unexpected error" + err.message, error: true });
    }
});


tradesRoute.get("/strategy-history/:strategy", async function (req, res) {
    try {

        const Strategy = req.params.strategy;

        // Creating a safe SQL query using parameterized query
        const sql = `SELECT * FROM ?? ORDER BY DateTime DESC LIMIT 8`;
        const sqlPromises = trade_tables[Strategy].map(tableName => {
            return new Promise((resolve, reject) => {
                connection.query(sql, [tableName], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        });

        const sqlresults = await Promise.all(sqlPromises);


        res.status(200).json({ data: sqlresults.flat(), error: false });

        // connection.query(sql, [formattedDate], (err, results) => {
        //     if (err) {
        //         res
        //             .status(500)
        //             .json({ message: "Error get trade history data", error: true });
        //         return;
        //     }
        //  console.log(results,"result");
        //     res.status(200).json({ data: results, error: false });
        //     return;
        // });

    } catch (err) {
        res.status(500).json({ message: "Unexpected error", error: true });
    }
});


module.exports = tradesRoute;