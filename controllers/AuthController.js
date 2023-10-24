const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {ObjectId} = require("mongodb")


const ResponseMessage = require('../constants/ResponseMessage');
const SERVICE_NAME = process.env.SERVICE_NAME;

const meta = {
    Context: 'AuthController',
    function: 'someFunction'
};

const {v4: uuidv4} = require("uuid");
const {generateTokens, generateAdminTokens} = require("../utils/jwt");

const {
    findUserByEmail,
    createUserByEmailAndPassword,
    findUserById
} = require("../repository/UserRepository");

const {
    addRefreshTokenToWhitelist,
    findRefreshTokenById,
    deleteRefreshToken,
    revokeTokens,
    getMember,
    getMemberWithId,
    setMemberIsRegistered,
    startUserSession,
    createSession
} = require("../repository/AuthRepository");

const {sendWelcomeEmail} = require('../repository/NotificationsRepository');
const {hashToken} = require('../utils/hashToken')
const {decrypt} = require('../utils/encryption')

const { isValidatedPasswordToken } = require('../middlewares/auth')

async function Test(req, res) {
    try {

        return res
            .status(201)
            .json({ msg : "Api est bien configurer" });

    } catch (err) {
        console.log(err)
        discordLogger.error("Une erreur s'est produite.", err);
        return res.status(400).json({msg: " Unsuccessful User Registration "});
    }
}

async function Register(req, res) {
    // #swagger.tags = ['Auths']
    // #swagger.summary = 'User register'
    // #swagger.description = 'Add a new user account'
    /* #swagger.parameters['body'] = {
              in: 'body',
              description: ' object',
              required: true,
              schema: { $ref: "#/definitions/UserRegisterModel" }
          } */
    try {
        const { password, memberId, } = req.body;
        // const { authorization } = req.headers;

        //verification du token
        const plainTextMember = isValidatedPasswordToken(memberId)

        if(plainTextMember.error){
            return res.status(400).json({ msg: plainTextMember.error  });
        }

        const memberData = await getMemberWithId(plainTextMember.id);

        if (!memberData || memberData.deleted_at !== null) { // Check if member is valide
            res.status(403);
            return res.status(400).json({msg: "Le membre est inrouvable"});
        }

        const email = memberData.email

        if (!email || !password) {
            res.status(400);
            return res
                .status(400)
                .json({msg : "You must provide an email and a password."});
        }
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            res.status(400);
            return res.status(400).json({ msg : "Email already in use." });
        }

        const user = await createUserByEmailAndPassword({ email, password });

        if(user){
            const registered = setMemberIsRegistered(memberData.id, req.params.token);
            console.log("registered est passer")
        }

        // const jti = (new ObjectId()).toString();
        //
        // const { accessToken, refreshToken } = generateTokens(user, jti);
        // if (user) {
        //     // emailWelcome(user.email)
        //     await sendWelcomeEmail(user.email);
        // }
        //
        // await addRefreshTokenToWhitelist({jti, refreshToken, userId: user.id});

        /* #swagger.responses[201] = {
                schema: { $ref: "#/definitions/User" },
                description: 'User saved'
            } */
        // res.json({
        //     accessToken,
        //     refreshToken
        // });
        return res
            .status(201)
            .json({ msg : "Mot de passe créé avec succès." });

    } catch (err) {
        console.log(err)
        // discordLogger.error("Une erreur s'est produite.", err);
        return res.status(400).json({msg: " Unsuccessful User Registration "});
    }
}

async function Login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                msg_code: ResponseMessage.MSG_600,
                msg: "You must provide an email and a password."
            });
        }

        const existingUser = await findUserByEmail(email);

        if (!existingUser) {
            console.log("Invalid User");
            return res.status(400).json({
                msg_code: ResponseMessage.MSG_601,
                msg: "Invalid login credentials."
            });
        }

        const tokens = await generateAllTokens(existingUser, res, req);
        
        // // Notez que vous ne renvoyez la réponse qu'une seule fois ici.
        return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        console.log("Error during authentication");
        console.log(err);
        return res.status(400).json({ msg: "Unsuccessful Login" });
    }
}

async function RefreshToken(req, res) {
    // #swagger.tags = ['Refresh Token']
    // #swagger.summary = 'Add a new token'
    // #swagger.description = 'Add a new RefreshToken'

    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400);
            return res.status(400).json({msg: "Missing refresh token."});
        }
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const savedRefreshToken = await findRefreshTokenById(payload.jti);

        if (!savedRefreshToken || savedRefreshToken.revoked === true) {
            res.status(401);
            return res.status(400).json({msg: "Unauthorized"});
        }

        const hashedToken = hashToken(refreshToken);

        if (hashedToken !== savedRefreshToken.hashedToken) {
            res.status(401);
            return res.status(400).json({msg: "Unauthorized"});
        }

        const user = await findUserById(payload.userId);

        if (!user) {
            res.status(401);
            return res.status(400).json({msg: "Unauthorized"});
        }
        const existingUser = await findUserByEmail(user.email);
        await deleteRefreshToken(savedRefreshToken.id);

        const tokens = await generateAllTokens(existingUser, res, req)

        res.json({
            accessToken : tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        console.log("Error when Refreshing Token.")
        console.log(err)
        // discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({msg: "Error when Refreshing Token."});
    }
}

async function RevokeRefreshTokens(req, res) {
    // #swagger.tags = ['Refresh Token']
    // #swagger.summary = 'Revoke a refresh Token'

    try {
        const {userId} = req.body;
        await revokeTokens(userId);
        res.json({msg: `Tokens revoked for user with id #${userId}`});
    } catch (err) {
        discordLogger.error( "Une erreur s'est produite.", formateError(err));
        return res.status(400).json({msg: "Error when revoking Token."});
    }
}

async function generateAllTokens(existingUser, req) {
    const jti = (new ObjectId()).toString();

    if (existingUser.isAdmin) {
        // Créez le token d'administrateur
        const { accessToken, refreshToken } = generateAdminTokens(
            existingUser,
            jti
        );
        await addRefreshTokenToWhitelist({
            jti,
            refreshToken,
            userId: existingUser.id
        });

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    } else {
        // Obtenez le membre avec l'e-mail de l'utilisateur
        const memberData = await getMember(existingUser.email);

        if (!memberData) {
            // Vérifiez si le membre est valide
            return {
                error: "Le membre est introuvable"
            };
        }

        // Vérification du type (mobile ou dashboard)
        // const type = req.params.type;

        // // ... Votre code de vérification du type ici ...

        // // Créez la donnée de session
        // const mySession = {
        //     memberId: memberData.id,
        //     userAgent: req.get('user-agent'),
        //     ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
        //     appType: type ? type : 'dashboard',
        //     isActive: true,
        // };

        // ... Créez la session utilisateur ...

        const { accessToken, refreshToken } = generateTokens(
            existingUser,
            memberData,
            jti
        );

        if (memberData.registered === false) {
            // Marquez l'utilisateur comme enregistré (mettez l'attribut à true)
            const setRegisterMember = await setMemberIsRegistered(memberData.id, accessToken);
        }

        await addRefreshTokenToWhitelist({
            jti,
            refreshToken,
            userId: existingUser.id
        });

//         const xForwardedFor = req.headers['x-forwarded-for'];
// const clientIP = xForwardedFor ? xForwardedFor.split(',').shift() : req.socket?.remoteAddress;

        console.log(
            "info",
            "Connexion réussie.",
            {
                user: existingUser.email,
                action: "Login",
                userAgent: req.get('user-agent'),
                service: SERVICE_NAME,
                // ip: clientIP,
            }
        );

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    }
}


// Middleware pour vérifier l'accès à l'application
function checkAppAccess(req, res, next) {
    const member = req.member; // Supposons que vous avez déjà récupéré le membre à partir de la base de données

    if (member.appaccess) {
        // Autoriser l'accès à l'application
        next();
    } else {
        // Interdire l'accès à l'application
        res.status(403).send('Accès à l\'application interdit');
    }
}

module.exports = {
    Register,
    Login,
    RefreshToken,
    RevokeRefreshTokens,
    Test
};
