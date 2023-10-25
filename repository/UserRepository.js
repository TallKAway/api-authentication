const { prisma } = require('../utils/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



function findUserByEmail(email) {
    return prisma.user.findUnique({
        where: {
            email: email,
        },
    });
}

function createUserByEmailAndPassword(user) {
    user.password = bcrypt.hashSync(user.password, 12);
    return prisma.user.create({
        data: user,
    });
}

function requestPassword(data) {
    return prisma.requestCreatePassword.create({
        data: {
            email       : data.email,
            hashedToken : data.token,
            couponCode  : data.generatedcode
        },
    });
}

// function requestPassword(hashedToken) {
//     return prisma.requestCreatePassword.create({
//         data: {
//             hashedToken : hashedToken
//         },
//     });
// }


async function checkRequestPassword(email, code) {
    return prisma.requestCreatePassword.findFirst({
        where: {
            couponCode : code,
            email: email
        },
    });
}


function findUserById(id) {
    return prisma.user.findUnique({
        where: {
            id,
        },
    });
}

async function checkPassword(userPassword, oldPassword) {
    return await bcrypt.compare(oldPassword, userPassword, (err, result) => {
        if (err) {
            return {
                success: false,
                message: "Incorrect password"
            }
        }
        if (result) {
            return {
                success: true,
                msg: "correct password"
            }
        }
    });

}

function checkResetCode(code, usertoken) {

    return jwt.verify(usertoken, process.env.JWT_ACCESS_SECRET, (err, token) => {
        console.log("token verified = ", token)
        if (err) {
            return false;
        }
        if (token && (code === token.key)) {
            return true;
        }
    });

}

function changePassword(email, newPassword) {

    const theNewPassword =  bcrypt.hashSync(newPassword, 12);

    return prisma.user.update({
        where: {
            email: email,
        },
        data: {
            password: theNewPassword
        }
    });
}


function resetPasswordByAdmin(user, generate) {
    user.password = bcrypt.hashSync(generate, 12);
    return prisma.user.update({
        where: {
            email: user.email,
        },
        data: {
            password: user.password
        }
    });
}



function createUser(userData) {
    userData.password = bcrypt.hashSync(userData.password, 12);
  return prisma.user.create({
    data: userData,
  });
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUserByEmailAndPassword,
    checkPassword,
    checkResetCode,
    changePassword,
    resetPasswordByAdmin,
    requestPassword,
    checkRequestPassword,
    createUser

};





// 'uEyMTw32v9'
// console.log(password);