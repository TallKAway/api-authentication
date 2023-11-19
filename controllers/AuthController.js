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
    findUserById,
    createUser
} = require("../repository/UserRepository");

const {
    addRefreshTokenToWhitelist,
    findRefreshTokenById,
    deleteRefreshToken,
    revokeTokens,
    getUser,
    getUserWithId,
    setMemberIsRegistered,
} = require("../repository/AuthRepository");

const {sendWelcomeEmail} = require('../repository/NotificationsRepository');
const {hashToken} = require('../utils/hashToken')
// const {decrypt} = require('../utils/encryption')

const { isValidatedPasswordToken } = require('../middlewares/auth')


/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints for user authentication
 */

/**
 * @swagger
 * /auth/test:
 *   get:
 *     summary: Test endpoint
 *     description: This endpoint is for testing.
 *     tags: [Authentication]
 *     responses:
 *       '200':
 *         description: A successful response
 */
async function Test(req, res) {

    try {

        return res
            .status(201)
            .json({ msg : "Api est bien configurer" });

    } catch (err) {
        console.log(err)
        // discordLogger.error("Une erreur s'est produite.", err);
        return res.status(400).json({msg: " Unsuccessful User Registration "});
    }
}


/**
 * @swagger
 * /auth/get/token:
 *   post:
 *     summary: Get Token
 *     description: Get an access token
 *     tags: [Authentication]
 *     requestBody:
 *       description: User email and password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Access token generated successfully
 *       '400':
 *         description: Bad request or unsuccessful user registration
 */
async function GetToken(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log(email, password)
            return res.status(400).json({ msg: "You must provide an email and a password." });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ msg: "Email already in use." });
        }

        // Créer un nouvel utilisateur avec email et mot de passe
        

       const jti = (new ObjectId()).toString();

            // Générer un accessToken et un refreshToken pour le nouvel utilisateur
            const { accessToken, refreshToken } = generateTokens(existingUser, jti);

            // Ajouter le refreshToken à la liste blanche
            await addRefreshTokenToWhitelist({ jti, refreshToken, userId: existingUser.id });

            // Répondre avec les tokens générés
            return res.status(201).json({ accessToken, refreshToken });

        return res.status(400).json({ msg: "Unsuccessful User Registration" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "An error occurred during registration" });
    }
}



/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Log in with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       description: User email and password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Login successful

 *       '400':
 *         description: Bad request or unsuccessful login
 */
async function Login(req, res) {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                msg_code: ResponseMessage.MSG_601,
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


        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            res.status(403);
            console.log("Invalide Password")
            return res.status(400).json({
                msg_code : ResponseMessage.MSG_601,
                msg: "Invalid login credentials."});
        }

        console.log("token 1")

        const tokens = await generateAllTokens(existingUser, res, req);
        
       console.log("tokens", tokens)

        return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user:existingUser
        });



 
    } catch (err) {
         console.log(err.message);
        console.log("Error during authentication");
        return res.status(400).json({ msg: "Unsuccessful Login" });
    }
}



/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register
 *     description: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       description: User data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               cellphone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '400':
 *         description: Bad request or unsuccessful user registration
 */
async function Register(req, res) {


  const userData = {
    username: req.body.username,
    email: req.body.email,
    cellphone: req.body.cellphone,
    password: req.body.password,
    // friends: [],
  };
    try {
      
        
    const user = await createUser(userData);
 const jti = (new ObjectId()).toString();
      const tokens = generateTokens(user, jti);
      
     

    res.status(201).json({
        status: ResponseMessage.MSG_311,
        message: "User created successfully",
        data: user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


/**
 * @swagger
 * /auth/refreshToken:
 *   post:
 *     summary: Refresh Token
 *     description: Refresh an access token
 *     tags: [Authentication]
 *     requestBody:
 *       description: Refresh token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Token refreshed successfully
 *       '400':
 *         description: Bad request or token refresh failure
 */
async function RefreshToken(req, res) {


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
            return res.status(400).json({ msg: "Unauthorized" });
            
        }

        

        const user = await findUserById(payload.userId);

        if (!user) {
            res.status(401);
            return res.status(400).json({msg: "Unauthorized"});
        }
        const existingUser = await findUserByEmail(user.email);
        await deleteRefreshToken(savedRefreshToken.id);

        const tokens = await generateAllTokens(existingUser, req);

        

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


/**
 * @swagger
 * /auth/revokeRefreshTokens:
 *   post:
 *     summary: Revoke Refresh Tokens
 *     description: Revoke all refresh tokens for a user
 *     tags: [Authentication]
 *     requestBody:
 *       description: User ID
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Refresh tokens revoked successfully
 *       '400':
 *         description: Bad request or token revocation failure
 */
async function RevokeRefreshTokens(req, res) {


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

    if (existingUser) {
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
        const userData = await getUser(existingUser.email);

        if (!userData) {
            // Vérifiez si le membre est valide
            return {
                error: "Le membre est introuvable"
            };
        }

        

        const { accessToken, refreshToken } = generateTokens(
            existingUser,
            userData,
            jti
        );
  await addRefreshTokenToWhitelist({
            jti,
            refreshToken,
            userId: existingUser.id
        });
    

        console.log(
            "info",
            "Connexion réussie.",
            {
                user: existingUser.email,
                action: "Login",
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




module.exports = {
    GetToken,
    Login,
    RefreshToken,
    RevokeRefreshTokens,
    Register,
    Test
};
