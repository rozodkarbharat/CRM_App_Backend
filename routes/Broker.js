const express = require("express");
const connection = require("../db");
var jwt = require("jsonwebtoken");
const AngelCheck = require("../utils/VerifyBroker");
require("dotenv").config();
const axios = require('axios');
const { FyersAPIActivation, FyersAccessToken } = require("../utils/Fyers");

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

async function setUpstoxToken({data,TOTP_Secret}) {
  return new Promise(async(resolve, reject) => {

    let { UserID, Api_Key, Secret_Key } = data;
    let code = TOTP_Secret;
    let client_id = Api_Key;
    let client_secret = Secret_Key;
    const postData = {
      code,
      client_id,
      client_secret,
      UserID,
    };
  
    console.log(UserID, code, client_id, client_secret, "api data");
    try {
      // URL and options for the POST request
      const url = 'http://216.48.177.99:2000/upstox_access_token';
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      };
      // Make the POST request using fetch
      let response = await fetch(url, options);
      resolve(await response.json())
 
    } catch (error) {
      resolve({})
    }
  })
}

const brokerRoute = express.Router();


brokerRoute.post("/add_broker", async (req, res) => {
    try {

        const token = req.headers.token.split(" ")[1];
        var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        const DateTime = dateAndTime();
        const { Broker, Api_Key, TOTP_Secret, Password, Secret_Key, Client_ID,Login_ID,Portal_Password,Sid,Server_ID,Auth_Token } =
            req.body.data;
        let URL=""
        if (Broker === "ANGEL") {
            let result = await AngelCheck({
                apikey: Api_Key,
                user_id: Client_ID,
                totp_secret: TOTP_Secret,
                password: Password,
            });

            if (!result?.data?.clientcode) {
                res.send({ message: "Invalid API", error: true })
                return;
            }
        }
        if(Broker==="FYERS"){
          URL=await FyersAPIActivation(Api_Key)
          console.log(URL,"URL")
          if (!URL) {
            res.send({ message: "Invalid API", error: true })
            return;
          }
        }

        const checkSql = "SELECT COUNT(*) AS count FROM api WHERE UserID = ?";

        connection.query(checkSql, [UserID], (err, result) => {
            if (err) {
                console.error("Error checking for data:", err);
                res
                    .status(500)
                    .json({ message: "Error checking for data", error: true });
                return;
            }

            const rowCount = result[0].count;

            let dataToInsert = {
                UserID,
                Broker,
                Api_Key,
                TOTP_Secret,
                Password,
                Secret_Key,
                Client_ID,
                DateTime,
                Login_ID,
                Portal_Password,
                Sid,
                Server_ID,
                Auth_Token
            };

            for (const key in dataToInsert) {
                if (dataToInsert[key] === undefined) {
                    dataToInsert[key] = "None";
                }
            }
            if (rowCount === 0) {
                let sql =
                    "SELECT COUNT(*) AS count FROM subcription WHERE UserID = ?";
                connection.query(sql, [UserID], (err, result) => {
                    if (err) {
                        console.log(err.message, " error adding trial")
                    }
                    const rowCount = result[0].count;
                    if (rowCount === 0) {
                        sql =
                            "INSERT INTO subcription (Subcription, Amount, DateTime, UserID,Strategies,ID) VALUES (?, ?, ?, ?,?,?)";
                        connection.query(sql, ["Trial", 0, DateTime, UserID, "None", "None"], (err, result) => {
                            if (err) {
                                console.log(err.message, " error adding trial")
                            }

                        });
                    }
                });

                sql = "INSERT INTO api (UserID, Broker, Api_Key, TOTP_Secret, Password, Secret_Key, Client_ID, DateTime, Login_ID, Sid, Portal_Password, Auth_Token, Server_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                const values = [
                    dataToInsert.UserID,
                    dataToInsert.Broker,
                    dataToInsert.Api_Key,
                    dataToInsert.TOTP_Secret,
                    dataToInsert.Password,
                    dataToInsert.Secret_Key,
                    dataToInsert.Client_ID,
                    dataToInsert.DateTime,
                    dataToInsert.Login_ID,
                    dataToInsert.Sid,
                    dataToInsert.Portal_Password,
                    dataToInsert.Auth_Token,
                    dataToInsert.Server_ID,
                ];
                connection.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("Error inserting data:", err);
                        res
                            .status(500)
                            .json({ message: "Error inserting data", error: true });
                        return;
                    }
                    res
                        .status(200)
                        .json({ message: "Brocker Added successfully",URL, error: false });
                    return;
                });
            } else {
                sql = "UPDATE api SET ? WHERE UserID = ?";
                 const {DateTime, ...filterData} =  dataToInsert
                connection.query(sql, [filterData, UserID], (err, result) => {
                    if (err) {
                        console.error("Error updating data:", err);
                        res
                            .status(500)
                            .json({ message: "Error updating data", error: true });
                        return;
                    }

                    // Check if a row was updated
                    if (result.affectedRows === 0) {
                        res
                            .status(404)
                            .json({ message: "User not found", error: true });
                        return;
                    }

                    res
                        .status(200)
                        .json({ message: "API updated successfully",URL, error: false });
                    return;
                });
            }
        });
    } catch (err) {
        res.send({ message: err.message, error: true });
    }
});

brokerRoute.get("/get_broker", async (req, res) => {
    try {
      const token = req.headers.token.split(" ")[1];
      var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  
      let sqlQuery = "SELECT * FROM api WHERE UserID = ? ";
      try {
        connection.query(sqlQuery, [UserID], (error, results) => {
          if (error) {
            res
              .status(500)
              .json({ message: "Error getting broker api data", error: true });
          }
          if (results.length > 0) {
            let result = results[0];
            res.status(200).send({ data: result, error: false });
          } else {
            res.status(200).send({ data: [], error: false });
            return;
          }
        });
      }
      catch (err) {
        res.status(500).json({ message: "Unexpected error", error: true });
        return;
      }
    } catch (err) {
      res.send({ message: err.message, error: true });
    }
  });

brokerRoute.post("/set-totp", async (req, res) => {
  try {
    let TOTP_Secret = req.body.TOTP_Secret;
    const token = req.headers.token.split(" ")[1];
    var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    let query = "Select * from api WHERE UserID = ?";

    connection.query(query, [UserID], async (err, result) => {
      if (err) {
        console.log("Error getting user data:", err.message);
        return res.status(500).json({ message: "Internal server error" });
      }
      try {
        let tokenRes = await setUpstoxToken({data:result[0],TOTP_Secret});
        if (tokenRes.Success) {
          const sql = "UPDATE api SET TOTP_Secret = ? WHERE UserID = ?";
          connection.query(sql, [TOTP_Secret, UserID], (err, result) => {
            if (err) {
              console.error("Error updating data:", err.message);
              return res.status(500).json({ message: "Internal server error" });
            }
            res.status(200).json({ message: "TOTP updated successfully" });
          });
        } else {
          return res
            .status(500)
            .json({ message: "Error while getting token from Upstox" });
        }
      } catch (error) {
        console.log("Error while setting up token:", error.message);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  } catch (err) {
    res.send({ message: err.message, error: true });
  }
});

brokerRoute.post("/set-fyers-totp", async (req, res) => {
  try {
    let auth_code = req.body.auth_code;
    const token = req.headers.token.split(" ")[1];
    var { UserID } = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    let query = "Select * from api WHERE UserID = ?";

    connection.query(query, [UserID], async (err, result) => {
      if (err) {
        console.log("Error getting user data:", err.message);
        return res.status(500).json({ message: "Internal server error" });
      }
      try {
        let tokenRes = await FyersAccessToken({code:auth_code,App_ID:result[0].Api_Key,Secret_ID:result[0].Secret_Key});
        if (tokenRes.access_token) {
          const sql = "UPDATE api SET TOTP_Secret = ? WHERE UserID = ?";
          connection.query(sql, [tokenRes.access_token, UserID], (err, result) => {
            if (err) {
              console.error("Error updating data:", err.message);
              return res.status(500).json({ message: "Internal server error" });
            }
            res.status(200).json({ message: "TOTP updated successfully" });
            return;
          });
        } else {
          return res
            .status(500)
            .json({ message: "Error while getting token from Fyers" });
        }
      } catch (error) {
        console.log("Error while setting up token:", error.message);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  } catch (err) {
    res.send({ message: err.message, error: true });
  }
});
  
   

brokerRoute.post("/add-kotak-neo", async (req, res) => {
  try {
      const { portal_username, portal_password, mobile_number, app_password, consumer_key, consumer_secret } = req.body;
      const base64key = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

    const tokenResponse = await axios.post("https://napi.kotaksecurities.com/oauth2/token", {
          grant_type: "password",
          username: portal_username,
          password: portal_password,
      }, {
          headers: {
              'accept': '*/*',
              'Authorization': `Basic ${base64key}`,
          }
      });

      if (tokenResponse.status === 200) {
          const accessToken = tokenResponse.data.access_token;

          const loginResponse = await axios.post("https://gw-napi.kotaksecurities.com/login/1.0/login/v2/validate", {
              mobileNumber: mobile_number,
              password: app_password,
          }, {
              headers: {
                  'accept': '*/*',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
              }
          });

          if (loginResponse.status === 201) {
              const { token, sid } = loginResponse.data.data;
              const { sub } = jwt.decode(token);
              const otpGenerationResponse = await axios.post("https://gw-napi.kotaksecurities.com/login/1.0/login/otp/generate", {
                  userId: sub,
                  sendEmail: true,
                  isWhitelisted: true
              }, {
                  headers: {
                      'accept': '*/*',
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`
                  }
              });
              res.status(200).json({ sub, sid, token, accessToken});
          } else {
            console.log("Error while validating login credentials");
              res.status(500).json({ message: "Error while validating login credentials",error:true });
          }
      } else {
        console.log("Error while obtaining access token");
          res.status(500).json({ message: "Error while obtaining access token",error:true  });
      }
  } catch (error) {
      // Handling errors
      // console.error(error);
      res.status(500).json({ message: "Internal Server Error",error:true  });
  }
});

    

brokerRoute.post("/verify-otp", async (req, res) => {
  try {
      const { sub, sid, token, otp, accessToken, portal_username, portal_password, mobile_number, app_password, consumer_key, consumer_secret } = req.body;
      const userToken = req.headers.token.split(" ")[1];
      var data = JSON.stringify({
        "userId": sub,
        "otp": otp
      });
      const responseLogin = await axios.post("https://gw-napi.kotaksecurities.com/login/1.0/login/v2/validate",
      data,
          {
              headers: {
                  accept: "application/json",
                  "Content-Type": "application/json",
                  sid: sid,
                  Auth: token,
                  Authorization: `Bearer ${accessToken}`,
              },
          }
      );
      

      if (responseLogin.status === 201) {
          const data = {
              Broker: "KOTAK",
              Api_Key: consumer_key,
              TOTP_Secret: accessToken,
              Password: app_password,
              Secret_Key: consumer_secret,
              Client_ID: portal_username,
              Login_ID: mobile_number,
              Portal_Password: portal_password,
              Server_ID: responseLogin.data.data.hsServerId,
              Sid: sid,
              Auth_Token: responseLogin.data.data.token,
          };

          const responseAddBroker = await axios.post(
              "https://back.moneymakers-algo.com/broker/add_broker",
              {
                  data,
              },
              {
                  headers: {
                      token: `Bearer ${userToken}`,
                  },
              }
          );

          if (responseAddBroker.status === 200) {
              res.status(200).json({
                  message: responseAddBroker.data.message,
              });
          } else {
            console.log("Failed to add broker");
            res.status(500).json({ message: "Failed to add broker",error:true  });
          }
      } else {
        console.log("Failed to validate OTP");
        res.status(500).json({ message: "Failed to validate OTP",error:true  });
      }
  } catch (error) {
      console.log(error);
      res.status(500).json({
          message: "Internal Server Error",
      });
  }
});

   

module.exports = brokerRoute;
