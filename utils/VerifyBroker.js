let { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");
const { TOTP } = require('totp-generator');

const AngelCheck = async ({ apikey, user_id, totp_secret, password }) => {
  const {otp}=TOTP.generate(totp_secret)
  console.log("check in angel",otp);

  let smart_api = new SmartAPI({
    api_key: apikey,
  });

  let data = await smart_api
    .generateSession(user_id, password, otp)
    .then(() => {
      return smart_api.getProfile();
    })
    .catch((err) => console.log("error generating" + err.message));
  // console.log(data,'data')
  return data;
};


module.exports = AngelCheck