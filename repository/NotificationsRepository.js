const dotenv = require('dotenv');
const axios = require('axios');

const { generateResetPassewordToken, generateCreatePassewordToken } = require('../utils/jwt');

const crypto = require('crypto');

dotenv.config();
const NOTIFICATION_URL = process.env.ROOMEE_NOTIFICATION_SERVICES_URL;
const RESET_PWD_FRONT_URL = process.env.RESET_PWD_FRONT_URL

async function sendWelcomeEmail(email) {
    const token = generateCreatePassewordToken(email);
    const tokenFrontRoute = RESET_PWD_FRONT_URL + token
    const response = await axios.post(NOTIFICATION_URL + 'mail/send', {
            "fromName": " ",
            "toEmail": email,
            "subject": "Creation de compote Roomee",
            "template": "create-account",
            "context": {
                email: email,
                tokenFrontRoute: tokenFrontRoute
            }
        })
        // console.log(response)
}


function generateCouponCode() {
    const codeLength = 6;
    const chars = '0123456789';
    let code = '';
    while (code.length < codeLength) {
        const randomBytes = crypto.randomBytes(8);
        const codeArray = new Uint32Array(randomBytes.buffer);
        code += chars[codeArray[0] % chars.length];
    }
    return code;
}
async function sendResetPassewordEmail(email) {

    const generatedcode = generateCouponCode();
    // console.log(generatedcode);

    // let generatedcode = couponCode.generate({
    //     parts: 1,
    //     partLen: 6
    // }); // generate 1 sections of the code with 6 letters
    console.log('the generated code ', generatedcode);
    const token = generateResetPassewordToken(email, generatedcode);
    const tokenFrontRoute = RESET_PWD_FRONT_URL + token
    const response = await axios.post(NOTIFICATION_URL + 'mail/send/', {
            "toEmail": email,
            "subject": "Mot de passe oublie",
            "template": "reset-passeword",
            "context": {
                email: email,
                generatedcode: generatedcode,
                tokenFrontRoute: tokenFrontRoute
            }
        })

        // console.log(response.request.res.statusCode)

    return {
        email: email,
        generatedcode: generatedcode,
        tokenFrontRoute: tokenFrontRoute,
        token:token
    };

}

async function sendResetPassewordEmailFromAdmin(email, passwordGenerate) {
    console.log('the password code ', passwordGenerate);
    const token = generateResetPassewordToken(email, passwordGenerate);
    const tokenFrontRoute = RESET_PWD_FRONT_URL_ADMIN + token
    const response = await axios.post(`${NOTIFICATION_URL}mail/send/`, {
            "toEmail": email,
            "subject": "Reinitialisation - Mot de passe oublie",
            "template": "reset-passeword-admin",
            "context": {
                email: email,
                passwordGenerate: passwordGenerate,
                tokenFrontRoute: tokenFrontRoute
            }
        })
        // console.log(response)
}

module.exports = {
    sendWelcomeEmail,
    sendResetPassewordEmail,
    sendResetPassewordEmailFromAdmin
};