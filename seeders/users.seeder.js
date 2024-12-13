'use strict';
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(12);
module.exports = {

    up: async (queryInterface, Sequelize) => {
        //await queryInterface.bulkDelete('Users', null, {});
        await queryInterface.bulkInsert('Users', [
            {
                userID: '00000000-0000-0000-0000-000000000001',
                name: 'test',
                password:  bcrypt.hashSync('test', salt),
                email: 'test@test.fr',
                role: 'admin',
            },
            {
                userID: '00000000-0000-0000-0000-000000000002',
                name: 'Jane Smith',
                password: bcrypt.hashSync('test', salt),
                email: 'jane.smith@example.com',
                role: 'user',
            },
            {
                userID: '00000000-0000-0000-0000-000000000003',
                name: 'Jim Brown',
                password: bcrypt.hashSync('test', salt),
                email: 'jim.brown@example.com',
                role: 'user',
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', null, {});
    }
}
