const { prisma } = require('../utils/database');
const { hashToken } = require('../utils/hashToken');


const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const USER_API_URL = process.env.TALLKAWAY_USER_SERVICES_URL;

function addRefreshTokenToWhitelist({ jti, refreshToken, userId }) {
    return prisma.refreshToken.create({
        data: {
            id: jti,
            hashedToken: hashToken(refreshToken),
            userId
        },
    });
}

function findRefreshTokenById(id) {
    return prisma.refreshToken.findUnique({
        where: {
            id : id,
        },
    });
}

function deleteRefreshToken(id) {
    return prisma.refreshToken.update({
        where: {
            id,
        },
        data: {
            revoked: true
        }
    });
}

function revokeTokens(userId) {
    return prisma.refreshToken.updateMany({
        where: {
            userId
        },
        data: {
            revoked: true
        }
    });
}

async function getMember(email) {

    try {
        const response =  await axios.get(USER_API_URL + 'user/get/with/' + email, { timeout: 50000 })
        return response.data.data
    }catch (error){
        // discordLogger.error( "Une erreur s'est produite.", formateError(error));
        console.log("Erreur lors de la recuperation d'un membre apres authentification")
        console.log(error)
    }

}
async function startUserSession(req, memberId, accessToken) {

    const data = {
        memberId: memberId,
        userAgent: req.get('user-agent'),
        ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
        appType: req.params.type == 'mobile' ? "Mobile" : "Web",
        token:  accessToken,
        isActive : true,
    }


    try {
        const response =  await axios.post(USER_API_URL + 'sessions/', data)
        // console.log(response)
    }catch (error){

        // console.log(error)
        console.log("Erreur lors de la creation de la session.")
    }

}

async function createSession(sessionDataBody) {

    try {
        const sessionData = await axios.post(USER_API_URL + 'sessions', sessionDataBody)
        // console.log("LA CREATION RAMENER => ",sessionData)
        return sessionData.data
    }catch (error){
        discordLogger.error( "Une erreur s'est produite.", formateError(error));
        console.log("Erreur lors de la recueration d'un membre apres authentification")
    }

}

async function getMemberWithId(memberId) {

    // const config = {
    //     headers: { Authorization: authorization }
    // };

    try {
        const response =  await axios.get(USER_API_URL + 'user/get/with/id/' + memberId, { timeout: 50000 })
        return response.data.data
    }catch (error){
        console.log(error)
        discordLogger.error( "Une erreur s'est produite.", formateError(error));
        console.log("Erreur lors de la recueration d'un membre")
    }

}

async function setMemberSession(req) {

    // const config = {
    //     headers: { Authorization: authorization }
    // };

    try {
        const memberData =  await axios.get(USER_API_URL + 'members/get/with/id/' + memberId, { timeout: 50000 })
        const sessionData = await axios.post(USER_API_URL + 'sessions', {
            memberId: memberData.data.data.id,
            userAgent: req.body.userAgent,
            ip: req.body.ip ? req.body.ip : ipAddress,
            appType: req.body.appType,
            isActive : true
        })

        return sessionData.data.data
    }catch (error){
        console.log(error)
        discordLogger.error( "Une erreur s'est produite.", formateError(error));
        console.log("Erreur lors de la recueration d'un membre")
    }

}

async function setMemberIsRegistered(memberId, token) {

    // const config = {
    //     headers: { Authorization: authorization }
    // };

    console.log("setMemberIsRegistered")
    // console.log(config)
    try {
        const response =  await axios.put(USER_API_URL + 'members/registered/update', { memberId:memberId, token:token})
        return response.data
    }catch (error){
        console.log(error)
        discordLogger.error( "Une erreur s'est produite.", formateError(error));
        console.log("Erreur lors de la mise a jour du membre")
    }

}

module.exports = {
    addRefreshTokenToWhitelist,
    findRefreshTokenById,
    deleteRefreshToken,
    revokeTokens,
    getMember,
    getMemberWithId,
    setMemberIsRegistered,
    startUserSession,
    createSession
};
