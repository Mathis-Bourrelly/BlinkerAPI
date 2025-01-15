const users = require('../model/users');

exports.getAllUsers = async () => {
    return await users.findAll();
};

exports.getUserById = async (id) => {
    return await users.findByPk(id);
};

exports.getUserByEmail = async (email) => {
    return await users.findOne({ where: { email } });
};

exports.createUser = async (data) => {
    return await users.create(data);
};

exports.updateUser = async (id, data) => {
    const [updatedRows] = await users.update(data, { where: { userID: id } });
    if (updatedRows === 0) return null; // Aucun utilisateur mis à jour
    return await users.findByPk(id);
};

exports.deleteUser = async (id) => {
    const deletedRows = await users.destroy({ where: { userID: id } });
    return deletedRows > 0; // Retourne `true` si un utilisateur a été supprimé
};
