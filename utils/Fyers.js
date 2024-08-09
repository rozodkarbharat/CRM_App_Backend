const FyersAPI = require("fyers-api-v3")
const crypto = require('crypto');
const { default: axios } = require("axios");


 const  FyersAPIActivation=(AppId)=> {
    return new Promise((resolve, reject) => {
        try{

            var fyers = new FyersAPI.fyersModel();
            // Set your APPID obtained from Fyers (replace "xxx-1xx" with your actual APPID)
            fyers.setAppId(AppId);
            // Set the RedirectURL where the authorization code will be sent after the user grants access
            // Make sure your redirectURL matches with your server URL and port
            fyers.setRedirectUrl(`https://app.moneymakers-algo.com/dashboard`);
    
            // Generate the URL to initiate the OAuth2 authentication process and get the authorization code
            var generateAuthcodeURL = fyers.generateAuthCode();
            //opne this link in new tab
            resolve (generateAuthcodeURL)
        }
        catch(e) {
            console.log(e,'error while activating fyers api')
            resolve("")
        }
    })
}


const  FyersAccessToken=({code,App_ID,Secret_ID}) =>{

    return new Promise((resolve, reject) => {
        try {
            const apiUrl = 'https://api-t1.fyers.in/api/v3/validate-authcode';

            const appIdHash = crypto.createHash('sha256').update(`${App_ID}:${Secret_ID}`).digest('hex');

            const requestData = {
                grant_type: 'authorization_code',
                appIdHash,
                code: code
            };
 

            axios.post(apiUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    console.log('Response:', response.data);
                    resolve(response.data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    resolve({})
                });
        }
        catch (error) {
            console.error('Error:', error);
            resolve({})
        }
    })

}


module.exports = {FyersAPIActivation,FyersAccessToken}