const express = require("express");
const userRoute = require("./routes/user");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connection = require("./db");
const subscriptionRoute = require("./routes/Subscription")
const ordersRoute = require("./routes/orders");
const ticketRoute = require("./routes/Ticket");
const tradesRoute = require("./routes/Trades");
const brokerRoute = require("./routes/Broker");
const startegyRoute = require("./routes/Strategy");
const visitersRoute = require("./routes/Visiter");
require("dotenv").config()
const cron = require("node-cron");
// const AMSuserRoute = require("./AMS/Routes/User");
// const AMSsubscriptionRoute = require("./AMS/Routes/Subscription");
// const AMSstrategyRoute = require("./AMS/Routes/Strategy");

const strategiesRoute = require("./routes/Strategies");
const CRMRoute = require("./routes/Crm");
const clientDetailRoute = require("./routes/clientDetail");
const verifyEmailRoute = require("./routes/Verifyemail");
const {sendNotifications, sendNotificationToSignup} = require("./utils/Notification");
const StockRouter = require("./routes/Stocks");

// const notificationData  = [
//   "Your neighbor is earning! Join the excitement.",
//   "Friend making money! Get in on the action.",
//   "Colleague's earnings up! Don't miss out.",
//   "Buddy earning! See your potential.",
//   "Peer earning – your turn! Start today.",
//   "Companion gaining income! Be part of it.",
//   "Acquaintance's profits rising! Check it out.",
//   "Fellow making gains! Don't be left behind.",
//   "Partner's earnings growing! Explore now.",
//   "Associate earning – your opportunity! Act today.",
//   "Ally's income increasing! Join the wave.",
//   "Pal earning cash! Start your journey."
// ]

const app = express();

 



app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use("/user", userRoute);
app.use("/subscription", subscriptionRoute);
app.use("/orders", ordersRoute);
app.use("/ticket", ticketRoute);
app.use("/trades", tradesRoute);
app.use("/broker", brokerRoute);
app.use("/strategy", startegyRoute);
app.use("/visiter", visitersRoute);
app.use("/client_detail",  clientDetailRoute)
app.use("/strategies", strategiesRoute)
app.use("/crm",CRMRoute)
app.use("/email", verifyEmailRoute)
app.use("/stocks", StockRouter)
// app.use("/ams_user",AMSuserRoute);
// app.use("/ams_subscription",AMSsubscriptionRoute);
// app.use("/ams_strategy",AMSstrategyRoute);

app.get("/", (req, res) => {
  res.send("Welcome to the Home page");
});


// cron.schedule('49 * * * *', () => {
//   url = "http://216.48.177.99:2000/cron_request"
//   fetch(url, {
//     method: 'GET'
//   })
//   .then((response) => {
//     console.log(response.status,"cron req response")
//   })
//   .catch((error) => {
//     console.log(error,"error in cron of every hour")
//   })
//   console.log(new Date(),"Cron runnning after every hour")
// });

 
 
//  function getTokens(){
//   return new Promise((resolve,reject)=>{
//     connection.query(`SELECT FirebaseToken FROM firetoken`, async (err, results) => {
//       if (err) {
//         console.error("Error retrieving Firebase tokens:", err);
//         reject(err);
//         return;
        
//       }
//       const tokens = results.map(row => row.FirebaseToken);
  
     
//       if (tokens.length === 0) {
//         reject("No tokens found.");
//         return;
//       }else{
//         resolve(tokens)
//       }

//     })
    
//   })
//  }

// // Schedule for 8:30 AM (Monday to Friday)
// cron.schedule('30 8 * * 1-5', async() => {
//   try { 
//     const tokens =  await getTokens();
    
//     console.log(tokens);
//     const index =  Math.floor(Math.random() *  notificationData.length)
//     sendNotifications("💡 Unleash Your Bot with Vp Algo Today!", notificationData[index],tokens);
    
//   } catch (error) {
//     console.log(error);
//   }
 
// });

// // Schedule for 8:45 AM (Monday to Friday)
// cron.schedule('45 8 * * 1-5', async() => {
//   try { 
//     const tokens =  await getTokens();

//     const index =  Math.floor(Math.random() *  notificationData.length)
//     sendNotifications("🔔 Time to Shine! Start Your Vp Algo Bot!", notificationData[index],tokens);
    
//   } catch (error) {
//     console.log(error);
//   } 
// });

// // Schedule for 9:00 AM (Monday to Friday)
// cron.schedule('0 9 * * 1-5', async() => {

//   try { 
//     const tokens =  await getTokens();
    
//     const index =  Math.floor(Math.random() *  notificationData.length)
//     sendNotifications("🚀 Ready to Roll? Start Your Bot Now!",  notificationData[index],tokens);
    
//   } catch (error) {
//     console.log(error);
//   } 
 
  
// });

// cron.schedule('0 16 * * 1-5', () => {
//   sendNotificationToSignup()
// });
 



app.listen(process.env.PORT, async () => {
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      return;
    }

    console.log("Connected on Port " + process.env.PORT);
  });
});
