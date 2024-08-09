const express = require("express");
require("dotenv").config();
const connection = require("../db");
var jwt = require("jsonwebtoken");

const subscriptionRoute = express.Router();

function isValidTrial({day,month,year}) {
  return new Promise((resolve, reject) => {
      try {
          trial = 2
          let today = new Date();
          const weekday = today.toLocaleDateString("en-US", {
              weekday: "short",
          });
          if (weekday === "Sun") {
              trial += 2;
          } else if (weekday === "Sat") {
              trial += 1;
          }
          else if (weekday === "Mon") {
            trial += 3;
        }
             
          const date = new Date(`${year}-${month}-${day+1}`);
          const formattedDate = `${date.toISOString().slice(0,10)}T00:00:00.000Z`;
          let trialdays=Math.floor((new Date()-new Date(formattedDate))/84600000)
          if(trialdays<trial){
            resolve(true)
          }
          else{
            resolve(false)
          }
      }
      catch (err) {
          resolve(false)
      }
  })


}

subscriptionRoute.get("/subscription-status", async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);


    const currentDate = new Date();
    const expireDate = new Date(currentDate);
    expireDate.setDate(currentDate.getDate() - 45);
    const formattedExpireDate = expireDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
 
      
    const sql = `
    SELECT * FROM subcription
    WHERE 
    STR_TO_DATE(DateTime, '%d-%m-%Y') >= ?
    AND UserID = ?`;

    let StartDate = "";
    let EndDate = "";
    let Subscription = "";
    let newdate = "";

    connection.query(sql, [formattedExpireDate, UserID], async(err, result) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Error getting subcriptions", error: true });
        return;
      }
      let trial = false;
      let TrialDate = []
      let Strategies = [];
      let dates = [];
      let premium = false;
      let subscriptiontype = "None"
      let data = []
      let trialData = []
      //  console.log(result,"result")
      if (result.length > 0) {
        for (var a = 0; a < result.length; a++) {
          if (result[a].Subcription === "Trial") {
            let trialdays=1
            StartDate = result[a].DateTime;
            // TrialDate
            const [datePart, timePart] = StartDate.split(" ");
            const [day, month, year] = datePart.split("-").map(Number);
            let isTrial= await isValidTrial({day,month,year})
            const date = new Date(year, month - 1, day);
            StartDate = date.toLocaleDateString("en-GB");
            const weekday = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            if (weekday === "Sat") {
              trialdays += 2;
            } else if (weekday === "Sun") {
              trialdays += 1;
            }
            else if (weekday === "Fri") {
              trialdays+=3
            }
            let newdate = new Date(date.setDate(date.getDate() + trialdays));
            EndDate = newdate.toLocaleDateString("en-GB");
            // TrialDate.push({StartDate,EndDate})
            let subscriptionDates = { StartDate, EndDate };
            if(isTrial){
              trialData.push({
                ...subscriptionDates,
                subscriptiontype: "Trial",
                Strategies: [],
              });
              trial=true
            }
          } else {
            let strategy = result[a].Strategies.trim("'");

            strategy = strategy.slice(1, strategy.length - 1);
            strategy = strategy.split(",");

            premium = true;
            Strategies = [...Strategies, ...strategy];
            StartDate = result[a].DateTime;
            const [datePart, timePart] = StartDate.split(" ");
            const [day, month, year] = datePart.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            StartDate = date.toLocaleDateString("en-GB");

            newdate = new Date(date.setDate(date.getDate() + 45));
            EndDate = newdate.toLocaleDateString("en-GB");
            let subscriptionDates = { StartDate, EndDate };
            data.push({
              ...subscriptionDates,
              subscriptiontype: "Premium",
              Strategies: strategy,
            });
          }

        }
      }
      let subscription = trial || premium
      subscriptiontype = premium ? "Premium" : trial ? "Trial" : "None"
      let subscriptionDetails = data.length > 0 ? data : trialData
      res.status(200).send({ message: "success", subscriptiontype, Strategies, subscriptionDetails, subscription, error: false });
      return;
    })
  } catch (error) {
    res.send({ message: error.message, error: true });
  }
});



module.exports = subscriptionRoute;