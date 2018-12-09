/* eslint no-use-before-define : "off", no-unused-vars : "off" */

const Discord = require('discord.js');
const beautify = require('js-beautify');
const mysql = require('mysql');
const connections = require('./connections.js');
const configs = connections.configs;

let guilds = new Discord.Collection(), dbs = ['configs', 'perms', 'data'], bot;

setInterval(() => {
    guilds = new Discord.Collection();
}, 3600000);

class guild {
    /**
     * Create a new local storage of highly used variables.
     * @param {string} id Id of the server, used as the key
     */
    constructor(id) {
        this.id = id;
    }
    /**
     * Updates data inside the class
     * @param {string} type Type of data to update
     * @param {{}} info Data to insert, array for words, object for everything else.
     */
    updateguild(type, info) {
        this[type] = info;
    }
    getItem(type) {
        return this[type];
    }
}
class table {
    constructor(mySettings) {
        this.name = 'table';
        this.guildref = mySettings.guildref;
        this.private = Boolean(mySettings.private);
        this.prefix = connect.decode(mySettings.prefix);
        this.admins = mySettings.admins.split('~');
        this.mods = mySettings.mods.split('~');
        this.premium();
    }
    /**
     * Get the premium status of a server
     * @returns {boolean} Whether or not the server is premium
     */
    async premium() {
        let res = await connect.querysql('configs', `SELECT * FROM table WHERE guildref = ${this.guildref}`).catch(() => { });
        this.premium = Boolean(res[0]);
    }
    /**
     * Update an item in this class.
     * @param {string} type type of item to update.
     * @param {*} item item information to update.
     */
    async updateItem(type, item) {
        this[type] = item;
        if (type == 'prefix') item = connect.encode(item);
        else if (['private'].includes(type)) item = Number(item);
        else if (['admins', 'mods', 'helpers'].includes(type)) item = item.join('~');
        await connect.querysql('configs', `UPDATE ${this.name} SET ${type} = '${item}' WHERE guildref = ${this.guildref}`);
    }
    /**
     * Bulk update portions of this class.
     * @param {{}} object Object with properties to update;
     */
    async updateBulk(object) {
        for (let item in object) {
            this[item] = object[item];
            if (item == 'prefix') object[item] = connect.encode(object[item]);
            else if (['private'].includes(item)) object[item] = Number(object[item]);
            else if (['admins', 'mods', 'helpers'].includes(item)) object[item] = object[item].join('~');
        }
        await connect.querysql('configs', `UPDATE ${this.name} SET ? WHERE guildref = ${this.guildref}`, object);
    }
    /**
     * Gets an item from this class.
     * @param {string} type type of item to get.
     * @returns {*} Item.
     */
    getItem(type) {
        return this[type];
    }
}

class guildData { }
class queryResult { }

const connect = {
    init: (client) => bot = client,
    encode: (string) => {
        if (!string || string.length == 0) return '';
        else return encodeURIComponent(string).replace(/%20/g, ' ');
    },
    decode: (string, guildref) => {
        try {
            return decodeURIComponent(string);
        } catch (err) {
            console.log('Failed to decode this string: ' + string + '\nGuildref: ' + guildref);
            return string;
        }
    },
    /**
     * Make a database query call using direct sql.
     * @param {string} db Database name
     * @param {string} sql Sql statement to run
     * @param {string} [args] Optional arguments
     * @returns {Promise<[queryResult]>}
     **/
    querysql: (db, sql, args) => {
        if (!dbs.includes(db)) return console.log('ERROR: Incorrect value for db in querysql: ' + db);
        if (args) sql = mysql.format(sql, args);
        return new Promise((resolve, reject) => {
            if (db == 'configs') {
                configs.query(sql, (err, result) => {
                    if (err && err.code != 'ER_CANT_AGGREGATE_2COLLATIONS') {
                        console.log(`SQL err from generic configs call: ` + err.code);
                        console.log('Error during database call: \nsql: ' + sql + '\nSQL message: ' + err.sqlMessage);
                        reject(Error(err.code));
                    }
                    resolve(result);
                });
            }
        });
    },
    /**
    * Get Settings class for a server
    * @param {guild} gld Discord guild id
    * @returns {Promise<table>}
    **/
    getSettings: async (gld) => {
        if (!gld || isNaN(gld)) return new Error('err with table guild not defined');
        let theguild = bot.servers.get(gld);
        let info;
        if (theguild && theguild.getItem('table')) return theguild.getItem('table');
        let result = await connect.querysql('configs', `SELECT * FROM table WHERE column = ${gld}`);
        if (result && result[0]) info = result[0];
        else {
            await connect.querysql('configs', `INSERT INTO table (column) VALUES (${gld}) ON DUPLICATE KEY UPDATE column=${gld}`);
            info = (await connect.querysql('configs', `SELECT * FROM table WHERE column = ${gld}`))[0];
        }
        info = new table(info);
        if (!theguild) {
            theguild = new guild(gld);
            bot.servers.set(gld, theguild);
        }
        theguild.updateguild('table', info);
        return info;
    },
    /**
    * Removes a guild from the cache.
    * @param {guild} theguild Discord guild id
    * @returns {[]} Array of booleans indicating if the cache was deleted.
    **/
    clearcache: (theguild) => bot.servers.delete(theguild),
    /**
    * Get data about a guild and post it in chat as readable data.
    * @param {message} message Discord message object, if provided, guild and channel will be auto filled.
    * @param {string} type Type of information
    * @param {guild} [guildid] Optional guild reference
    * @param {channel} [channel] Optional Channel reference
    **/
    format: (message, type, guildid = message.guild.id, channel = message.channel) => {
        type = 'get' + type.slice(0, 1).toUpperCase() + type.slice(1);
        connect[type](guildid).then(info => {
            let string = beautify(JSON.stringify(info), { indent_size: 2 });
            channel.send(string, { split: true, code: 'js' });
        }).catch(err => {
            channel.send(err.stack, { code: 'js' });
        });
    },
};
module.exports = connect;