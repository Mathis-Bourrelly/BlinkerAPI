const users = require('../model/users')
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(12);

exports.getAllUsers = async () => await users.findAll();

exports.getUserById = async (userID) => {
    return await users.findByPk(userID)
};
exports.getUserByEmail = async (email) => {
    return await users.findOne({where: {email}});
};
exports.createUser = async (body) => {
    body.password = bcrypt.hashSync(body.password, salt);
    return await users.create(body);
};

exports.updateUserLogin = async (userID, data) => {
    const foundUser = await users.findOne({where: {userID}});

    if (!foundUser) {
        throw new Error('User not found');
    }
    await users.update({password: bcrypt.hashSync(data.password, salt),email:data.email}, {
        where: {userID}
    });
}

exports.updateUser = async (userID, data) => {
    await users.update({name: data.name,}, {where: {userID}})
    return await users.findByPk(userID)
}


exports.deleteUser = async (userID) => {
    await users.destroy({where: {userID}});
}
