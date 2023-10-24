const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ResponseMessage = require('../constants/ResponseMessage');

const {
    findUserById,
    checkPassword,
    findUserByEmail,
    changePasswordInApp,
    checkResetCode,
    changePassword,
    resetPasswordByAdmin,
    requestPassword,
    checkRequestPassword
} = require('../repository/UserRepository');

const {verifyToken} = require('../utils/jwt');

const { getMember } = require('../repository/AuthRepository')
const generator = require('generate-password');
const { sendResetPassewordEmail, sendResetPassewordEmailFromAdmin } = require('../repository/NotificationsRepository');


const {decrypt} = require('../utils/encryption')

const { isValidatedPasswordToken } = require('../middlewares/auth')

async function Profile(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'User profil'
    // #swagger.description = 'detail of user account'
    /* #swagger.parameters['authorization'] = {
            in: 'header',
            description: ' user access token',
            required: true,
            schema: { example: {authorization:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzQ2ZWVmOGMwYzQ2NmYxNTU2MWMxMzAiLCJqdGkiOiJjYWE2NzA4MS1iN2I5LTQ0ZDQtOGUzMy00NGFiYWJhYWVlOGEiLCJpYXQiOjE2NjU1OTMyNzksImV4cCI6MTY2NTYwNzY3OX0.aJ7S60RSz6BI4NjTht7A7zYYQ_XLb2t7syZMT6BLaeQ'} }
        } */
    try {
        const { userId } = req.payload;
        const user = await findUserById(userId);
        delete user.password;

        // get Member with user email

        let  memberData;

        if(user.isAdmin){
             memberData = await findUserByEmail(user.email)
        }else {
             memberData = await getMember(user.email)
        }

        /* #swagger.responses[201] = {
            schema: { $ref: "#/definitions/User" },
            description: 'User logged'
        } */
        return res
            .status(201)
            .json({data:memberData});
    } catch (err) {
        console.log(err)
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful Profil Registration"  });
    }

}

async function CheckUserPassword(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Check user password'
    // #swagger.description = 'checking of user account password'
    /* #swagger.parameters['authorization'] = {
            in: 'header',
            description: ' user access token',
            required: true,
            schema: { example: {authorization:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzQ2ZWVmOGMwYzQ2NmYxNTU2MWMxMzAiLCJqdGkiOiJjYWE2NzA4MS1iN2I5LTQ0ZDQtOGUzMy00NGFiYWJhYWVlOGEiLCJpYXQiOjE2NjU1OTMyNzksImV4cCI6MTY2NTYwNzY3OX0.aJ7S60RSz6BI4NjTht7A7zYYQ_XLb2t7syZMT6BLaeQ'} }
        } */
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: ' user body',
        required: true,
        schema: { $ref: "#/definitions/UserResetInApp" }
    } */
    try {
        const checkResponse = await checkPassword(req.body.oldPassword, req.body.password)
            /* #swagger.responses[201] = {
                schema: { $ref: "#/definitions/UserCheckingAns" },
                description: 'password checking status'
            } */
        return res
            .status(201)
            .json(checkResponse);
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}

async function RequestResetPassword(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Send reset password request'
    // #swagger.description = 'send the request to ask reseting password'

    try {
        const theBody = {
            token: req.body.token,
            generatedcode: req.body.generatedcode,
            email: req.body.email
        }
        const checkResponse = await requestPassword(theBody)

        return res
            .status(201)
            .json(checkResponse);
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}

async function CheckRequestResetPassword(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Check reset password request'
    // #swagger.description = 'checking the  user reset password request'

    try {
        const checkResponse = await checkRequestPassword(req.body.email, req.body.code )

        if(checkResponse){
            // Verifier la validite du token
            const checkCodeResponse = await checkResetCode(checkResponse.couponCode, checkResponse.hashedToken)
            console.log(checkCodeResponse)
            if (checkCodeResponse === true){

                return res
                    .status(201)
                    .json(
                        {
                            MSG_CODE:"MSG_CODE",
                            data : checkResponse
                        }
                    );
            }
        }


            /* #swagger.responses[201] = {
                schema: { $ref: "#/definitions/UserCheckingAns" },
                description: 'password checking status'
            } */
        return res
            .status(203)
            .json(
                {
                    MSG_CODE:"MSG_CODE",
                    data : {}
                }
            );
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}

async function ChangePasswordInApp(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Change user password inApp'
    // #swagger.description = 'update her user account password'
    /* #swagger.parameters['authorization'] = {
            in: 'header',
            description: ' user access token',
            required: true,
            schema: { example: {authorization:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzQ2ZWVmOGMwYzQ2NmYxNTU2MWMxMzAiLCJqdGkiOiJjYWE2NzA4MS1iN2I5LTQ0ZDQtOGUzMy00NGFiYWJhYWVlOGEiLCJpYXQiOjE2NjU1OTMyNzksImV4cCI6MTY2NTYwNzY3OX0.aJ7S60RSz6BI4NjTht7A7zYYQ_XLb2t7syZMT6BLaeQ'} }
        } */
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: ' user body',
        required: true,
        schema: { $ref: "#/definitions/UserUpdateInApp" }
    } */
    try {

        const { userId } = req.payload;
        const user = await findUserById(userId);
        const  isUserExist  = await findUserByEmail(user.email)

        if (!isUserExist) {
            res.status(403);
            console.log("Invalide User")
            return res.status(400).json({
                msg_code : ResponseMessage.MSG_623,
                msg: "L'utilisateur n'existe pas."
            });
        }

        const validPassword = await bcrypt.compare(req.body.oldPassword, isUserExist.password);
        if (!validPassword) {
            res.status(403);
            console.log("Invalide Password")
            return res.status(400).json({
                msg_code : ResponseMessage.MSG_622,
                msg: "Ancien mot de passe incorrect."});
        }

        const checkResponse = await changePassword(user.email, req.body.newPassword)

        /* #swagger.responses[201] = {
            schema: { $ref: "#/definitions/UserChangeAns" },
            description: 'password checking status'
        } */
        return res
            .status(201)
            .json({
                msg_code : ResponseMessage.MSG_620,
                msg: "password updated !",
                data: checkResponse
            });
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({  msg_code : ResponseMessage.MSG_621, msg: "Erreur lors de la mise a jour du mot de passe."  });
    }

}

async function ChangePassword(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Change user password'
    // #swagger.description = 'update her user account password'

    try {

        let theResult;
        console.log("req.body")
        console.log(req.body)
        const checkRes = await checkRequestPassword(req.body.email, req.body.pin )
        if (checkRes){

            if (verifyToken(checkRes.hashedToken)) {
                // le token est valide
                const theUser = await  findUserByEmail(req.body.email);
                // Verifier le une foi encore la validite du code
                const checkResponse = await changePassword(req.body.email, req.body.newPassword)
                theResult = {
                    success: true,
                    msg: "password updated !",
                    data: checkResponse
                }
                return res
                    .status(201)
                    .json(theResult);
            } else {
                // le token est invalide
                return res
                    .status(201)
                    .json({
                        MSG_CODE : ""
                    });
            }

        }else{

        }



        /* #swagger.responses[201] = {
            schema: { $ref: "#/definitions/UserChangeAns" },
            description: 'password checking status'
        } */
        return res
            .status(201)
            .json(theResult);
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}

async function SendResetEmail(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Ask reset user password with email'
    // #swagger.description = 'update her user account password'
    /* #swagger.parameters['email'] = {
        in: 'body',
        description: ' user email',
        required: true
       
    } */
    try {

        const existingUser = await findUserByEmail(req.body.email);
        let theResult;
        if (existingUser) {
            // const checkResponse = emailResetPassword(req.body.email)
            const  response = await sendResetPassewordEmail(req.body.email)

            const checkResponse = await requestPassword(response)

            return res
                .status(201)
                .json({
                    MSG_CODE: true,
                    msg: "code for reset password sent !!",
                    data: response
                });
        }
        /* #swagger.responses[201] = {
            schema: { $ref: "#/definitions/UserChangeAns" },
            description: 'password checking status'
        } */
        return res
            .status(203)
            .json({
                MSG_CODE: false,
                msg: "Error",
                data: {}
            });
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}

// async function ChangePasswordWithEmail(req, res) {
//     // #swagger.tags = ['User']
//     // #swagger.summary = 'Ask reset user password with email'
//     // #swagger.description = 'update her user account password'
//     /* #swagger.parameters['email'] = {
//         in: 'body',
//         description: ' user email',
//         required: true
       
//     } */
//     try {

//         const existingUser = await findUserByEmail(req.body.email);

//         let theResult;
//         if (existingUser) {
//             const checkResponse = emailResetPassword(req.body.email)
//             theResult = {
//                 success: true,
//                 msg: "code for reset password sent !!",
//                 data: checkResponse
//             }
//         } else {
//             theResult = {
//                 success: false,
//                 msg: "Sorry !!! user with this email doesn't registered !!"
//             };
//         }
//         /* #swagger.responses[201] = {
//             schema: { $ref: "#/definitions/UserChangeAns" },
//             description: 'password checking status'
//         } */
//         return res
//             .status(201)
//             .json(theResult);
//     } catch (err) {
//         discordLogger.error( "Une erreur s'est produite.", formateError(err));
//         return res.status(400).json({ msg: "Unsuccessful User Password Checking" });
//     }

// }

async function CheckUserResetCode(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Check user reset code'
    // #swagger.description = 'checking of user reset code sent'

    try {
        // const checkResponse = await checkResetCode(req.body.code, req.body.email)
        const checkResponse = await checkResetCode(req.body.code, req.body.token)
            /* #swagger.responses[201] = {
                schema: { $ref: "#/definitions/UserCheckingAns" },
                description: 'password checking status'
            } */
        return res
            .status(201)
            .json(checkResponse);
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking" });
    }

}

async function ChangePasswordByAdmin(req, res) {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Change user password by Admin'
    // #swagger.description = 'update the specific user account password'
    /* #swagger.parameters['authorization'] = {
             in: 'header',
             description: ' user access token',
             required: true,
             schema: { example: {authorization:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzQ2ZWVmOGMwYzQ2NmYxNTU2MWMxMzAiLCJqdGkiOiJjYWE2NzA4MS1iN2I5LTQ0ZDQtOGUzMy00NGFiYWJhYWVlOGEiLCJpYXQiOjE2NjU1OTMyNzksImV4cCI6MTY2NTYwNzY3OX0.aJ7S60RSz6BI4NjTht7A7zYYQ_XLb2t7syZMT6BLaeQ'} }
         } */
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: ' user body',
        required: true,
        schema: { $ref: "#/definitions/User" }
    } */
    try {
        const passwordGenerate = generator.generate({
            length: 10,
            numbers: true,
            symbols: true
        });
        let theResult;
        const checkResponse = await resetPasswordByAdmin(req.body, passwordGenerate)
        if (checkResponse) {
            sendResetPassewordEmailFromAdmin(req.body.email, passwordGenerate)
            theResult = {
                success: true,
                msg: "password updated !",
                data: checkResponse
            }
        } else {
            theResult = {
                success: false,
                msg: "X! user password reseting failed !X"
            }
        }
        /* #swagger.responses[201] = {
            schema: { $ref: "#/definitions/UserChangeAns" },
            description: 'password checking status'
        } */
        return res
            .status(201)
            .json(theResult);
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({ msg: "Unsuccessful User Password Checking"  });
    }

}




module.exports = {
    Profile,
    CheckUserPassword,
    ChangePasswordInApp,
    SendResetEmail,

    CheckUserResetCode,
    ChangePassword,
    ChangePasswordByAdmin,
    RequestResetPassword,
    CheckRequestResetPassword
};