const jwt = require('jsonwebtoken');
const { encrypt} = require('./encryption')

function generateAccessToken(user, userData,session) {
    const usrData = userData.pseudo + '__'+ userData.id 
    // console.log(usrData)
    return jwt.sign(
        {
            userId: user.id,
            usrData : encrypt(usrData),
            chatUserId: userData.chatUserId,
            // sessionId:session.id
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: '24h',
        });
}

function generateAdminAccessToken(user) {
    return jwt.sign({
        userId: user.id,
        isAdmin: true,
        chatApiKey: process.env.ADMIN_TOKEN
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '24h',
    });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        return true;
    } catch (err) {
        return false;
    }
}


function generateRefreshToken(user, userData, jti,session) {
    const usrData = userData.pseudo + '__'+ userData.id 
    return jwt.sign({
        userId: user.id,
        usrData : encrypt(usrData),
        chatUserId: userData.chatUserId,
        jti,
        // sessionId:session.id
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '1w',
    });
}

function generateAdminRefreshToken(user, jti) {
    return jwt.sign({
        userId: user.id,
        isAdmin: true,
        chatApiKey: process.env.ADMIN_TOKEN,
        jti
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '1w',
    });
}

function generateTokens(user, memberData, jti,session) {
    const accessToken = generateAccessToken(user, memberData,session);
    const refreshToken = generateRefreshToken(user, memberData, jti,session);

    return {
        accessToken,
        refreshToken,
    };
}

function generateAdminTokens(user, jti) {
    const accessToken = generateAdminAccessToken(user);
    const refreshToken = generateAdminRefreshToken(user, jti);

    return {
        accessToken,
        refreshToken,
    };
}

function generateCreatePassewordToken(email) {
    return jwt.sign({
        email: email,
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '4h',
    });
}

function generateResetPassewordToken(email, generatedcode) {
    return jwt.sign({
        email: email,
        key: generatedcode
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '24h',
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    generateAdminTokens,
    generateResetPassewordToken,
    generateCreatePassewordToken,
    verifyToken
};
