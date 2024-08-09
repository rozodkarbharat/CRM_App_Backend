const { Router } = require("express");
const { default: yahooFinance } = require("yahoo-finance2");
const fs = require("fs");
const path = require("path");
const StockRouter = Router();
const connection = require("../db");
const { default: axios } = require("axios");
const xml2js = require("xml2js");
var jwt = require("jsonwebtoken");
const ordertable = {
  UPSTOX: "upstox_orders",
  ANGEL: "orders",
  KOTAK: "kotak_orders",
  DHANHQ: "dhan_orders",
  FYERS: "fyers_orders",
};
function fetchStockData(symbol) {
  const queryOptions = { period1: "2018-01-01", interval: "1d" };
  return yahooFinance.historical(symbol + ".NS", queryOptions)
    .then(result => result)
    .catch(error => {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    });
}

function fetchStockNews(symbol) {
  const url = `https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms`;
  return axios.get(url)
    .then(response => {
      const xmlData = response.data;

      // Parse the XML data
      const parser = new xml2js.Parser();
      return parser.parseStringPromise(xmlData);
    })
    .then(result => {
      // Extract relevant information
      const newsItems = result.rss.channel[0].item.map((item) => {
        const description = item.description[0]
          .replace(/<!\[CDATA\[|\]\]>/g, "")
          .trim();
        const title = item.title[0].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
        const imgSrc =
          item.enclosure && item.enclosure[0] && item.enclosure[0].$.url
            ? item.enclosure[0].$.url
            : "";

        return {
          title: title,
          link: item.link[0],
          description: description,
          image: imgSrc,
          pubDate: item.pubDate[0],
        };
      });
      return newsItems;
    })
    .catch(error => {
      console.error(`Error fetching news for ${symbol}:`, error);
      throw error;
    });
}


StockRouter.get("/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const stockData = await fetchStockData(symbol);

    res.status(200).json({ data: stockData, error: false });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

StockRouter.get("/news/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const news = await fetchStockNews(symbol);
    res.status(200).json({ data: news, error: false });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

StockRouter.get("/recommendation_stock", (req, res) => {
  
  try {
    const query = `
    SELECT equity_trades.*, 
           stocks.StockName
    FROM equity_trades
    JOIN stocks 
      ON equity_trades.Symbol = stocks.Symbol
    WHERE equity_trades.Exited = '1'`;
    connection.query(query, (err, result) => {
      if (err) {
        res.status(500).json({ error: true, message: "Error in sql query" });
        console.log(err);
      }

      if (result.length > 0) {
        res.status(200).json({ error: false, data: result });
      } else {
        res.status(200).json({ error: false, data: [] });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});
StockRouter.get("/recommendate_stock_detail/:symbol", (req, res) => {
  try {

    const symbol = req.params.symbol;
    const query = `SELECT equity_trades.*, 
    stocks.*
FROM equity_trades
JOIN stocks 
ON equity_trades.Symbol = stocks.Symbol
WHERE equity_trades.Exited = '1' 
AND equity_trades.Symbol = "${symbol}"`;


    connection.query(query, (err, result) => {
      if (err) {
        console.log(err);
        res
          .status(500)
          .json({
            error: true,
            message:
              "An error occurred while processing your request. Please try again later.",
          });
        return;
      }
      res
        .status(200)
        .json({ error: false, data: result.length > 0 ? result : [] });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

 

StockRouter.get("/exited_calls", (req, res) => {
  try {
    const { startDate, endDate } = req.query;
 
    let query = `
      SELECT equity_trades.*, 
             stocks.StockName
      FROM equity_trades
      JOIN stocks 
        ON equity_trades.Symbol = stocks.Symbol`;

    if (startDate && endDate) {
      query += ` AND equity_trades.DateTime BETWEEN '${startDate}' AND '${endDate}'`;
    }

    connection.query(query, (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting orders", error: true });
        return;
      }
      console.log(result);

      res.status(200).json({ error: false, data: result.length > 0 ? result : [] });
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});


module.exports = StockRouter;
