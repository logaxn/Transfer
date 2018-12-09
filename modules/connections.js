const mysql = require('mysql'), creds = require('../config.json');
const pools = {
    configs: mysql.createPool({
        connectionLimit: 1,
        host: creds.mysql.host,
        user: creds.mysql.user,
        password: creds.mysql.password,
        database: 'database',
        multipleStatements: true,
    }),
};
module.exports = pools;
setInterval(() => {
    pools.configs.query('SELECT * FROM table LIMIT 1');
}, 250000);