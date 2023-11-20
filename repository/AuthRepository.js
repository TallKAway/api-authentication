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

async function getUser(email) {

    try {
        const response =  await axios.get(USER_API_URL + 'user/get/with/' + email, { timeout: 50000 })
        return response.data.data
    }catch (error){
       
        console.log("Erreur lors de la recuperation d'un membre apres authentification")
        console.log(error)
    }

}




async function getUserWithId(userId) {

    // const config = {
    //     headers: { Authorization: authorization }
    // };

    try {
        const response =  await axios.get(USER_API_URL + 'user/get/with/id/' + userId, { timeout: 50000 })
        return response.data.data
    }catch (error){
        console.log(error)
        
        console.log("Erreur lors de la recuperation d'un membre")
    }

}





module.exports = {
    addRefreshTokenToWhitelist,
    findRefreshTokenById,
    deleteRefreshToken,
    revokeTokens,
    getUser,
    getUserWithId,
};
