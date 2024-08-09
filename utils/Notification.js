// const admin = require("firebase-admin");
// const serviceAccount = require("../vp-algo-firebase-adminsdk-bh35z-9aef73bcd1.json");
// const connection = require("../db");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });


// const sendNotifications = async (title, body,tokens) => {
//     try {
//       // Retrieve all Firebase tokens from the database
     
  
//         // Extract tokens from results
       
  
//         // Construct the message to be sent
//         const message = {
//           notification: {
//             title: title,
//             body: body,
//           },
//           tokens: tokens,
//         };
  
//         // Send the message
//         admin.messaging().sendEachForMulticast(message)
//           .then((response) => {
//             console.log(`${response.successCount} messages were sent successfully`);
//             // Handle any errors and clean up invalid tokens
//             response.responses.forEach((resp, idx) => {
//               if (!resp.success) {
//                 const errorCode = resp.error.errorInfo.code;
//                 if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
//                   // Remove the invalid token from the database
//                   const invalidToken = tokens[idx];
//                   connection.query(`DELETE FROM firetoken WHERE FirebaseToken = ?`, [invalidToken], (err, result) => {
//                     if (err) {
//                       console.error("Error removing invalid token from database:", err);
//                     } else {
//                       console.log("Invalid token removed from database:", invalidToken);
//                     }
//                   });
//                 }
//               }
//             });
//           })
//           .catch((error) => {
//             console.error("Error sending multicast message:", error);
//           });
      
//     } catch (error) {
//       console.error("Error in cron job:", error);
//     }
//   };

//   const sendNotificationToSignup = async()=>{
//     try {
//         const query  = `SELECT f.FirebaseToken
//         FROM firetoken f
//         LEFT JOIN subcription s ON f.UserID = s.UserID
//         WHERE s.UserID IS NULL OR s.Subcription != 'premium'`
//         connection.query(query, (err, result)=>{
//             if(err){
//                 console.log(err);
//             }
//             if(result.length>0){
//                 const tokens =  result.map((elm)=>elm.FirebaseToken);
//                 sendNotifications("Transform Your Trading Experience!", "Dear, take control of your trading outcomes with our expert strategy. Upgrade now and start winning more trades!", tokens)
//             }
//         })
        
//     } catch (error) {
//         console.log(error);
//     }

//   }

//   module.exports = {sendNotifications,sendNotificationToSignup}