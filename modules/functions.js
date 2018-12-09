/* eslint no-use-before-define : "off", no-unused-vars : "off" */

const connect = require('./connect.js');

let canchecks = {};

class message { }

const functions = {
    blue: 3447003,
    red: '#ff0000',
    green: 65341,
    purple: 8716543,
    yellow: '#ffe230',
    orange: 15105570,
    teal: '#1CE4D4',
    black: 0,
    gray: '',
    pink: 16266671,
    white: '#ffffff',
    neon: 13694723,
    /**
    * Wait a designated amount of time.
    * @param {number} time The amount of time in seconds to wait.
    * @returns {promise<*>} You must await this.
    **/
    wait(time) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`I have waited ${time} seconds too long dammit!`);
            }, time * 1000);
        });
    },
    err: (type, error) => { console.log('Error doing' + type + ':\n' + error.stack); },
    /**
    * Send a message in a plaintext.
    * @param {message} themsg Discord message.
    * @param {string} send Message to send.
    * @param {number} [deletetime] Optional delete time
    **/
    reply: async (themsg, send, deletetime) => {
        try {
            let msg = await themsg.channel.send(send, { disableEveryone: true, split: true });
            if (deletetime && deletetime != -1)
                setTimeout(() => {
                    if (!Array.isArray(msg)) functions.deletem(msg);
                    else themsg.channel.bulkDelete(msg).catch(() => {
                        msg.map(m => m.delete().catch(() => { }));
                    });
                }, deletetime * 1000);
            else return msg;
        } catch (error) {
            return await themsg.author.send(send, { split: true }).catch(() => { });
        }
    },
    /**
    * Send a message in an embed.
    * @param {message} themessage Discord message.
    * @param {string} send Message to send.
    * @param {number} [deletetime] Optional delete time
    **/
    notify: async (themessage, send, deletetime) => {
        try {
            let msg = await themessage.channel.send({ embed: { description: send, color: functions.blue } });
            if (deletetime && deletetime != -1) msg.delete({ timeout: deletetime * 1000 }).catch(() => { });
            else return msg;
        } catch (error) {
            return await functions.reply(themessage, send, deletetime);
        }
    },
    deletem: (themessage, timeout = 0) => { if (themessage) themessage.delete({ timeout: timeout }).catch(() => { }); },
    /**
    * Get the permissions of a person
    * @param {message} themessage Discord message.
    * @param {boolean|string} others Use boolean to check for mention or id for a user
    * @returns {string[]}Array of perms.
    **/
    check: (themessage, others) => new Promise(async (resolve, reject) => {
        try {
            let perms = ['global', 'admin', 'mod', 'helper'];
            let person;
            if (typeof others != 'boolean') {
                person = themessage.guild.members.get(others);
                if (!person) person = await themessage.guild.members.fetch(others).catch(() => { });
            } else {
                let mem = themessage.mentions.members.first();
                if (others && mem) {
                    person = themessage.guild.members.get(mem.id);
                    if (!person) person = await themessage.guild.members.fetch(mem.id).catch(() => { });
                } else {
                    person = themessage.member;
                    if (!person) person = await themessage.guild.members.fetch(themessage.author.id).catch(() => { });
                }
            }
            if (!person) return resolve([]);
            let guilddata;
            let count = 0;
            do {
                count++;
                guilddata = await connect.getSettings(themessage.guild.id);
            } while (!guilddata && count <= 5);
            if (count > 5) return resolve([]);
            else perms.shift();
            if (guilddata.admins.some(id => person.roles.get(id)) || person.hasPermission('MANAGE_GUILD')) return resolve(perms);
            else perms.shift();
            if (guilddata.mods.some(id => person.roles.get(id))) return resolve(perms);
            perms.shift();
            return resolve(perms);
        } catch (err) {
            reject(Error('Something failed inside the check promise.' + err.stack));
        }
    }),
    getcheck: async (type, themessage) => {
        if ((await functions.check(themessage, false)).includes('admin')) return true;
        if (!canchecks[type]) canchecks[type] = [];
        else if (canchecks[type].includes(themessage.guild.id)) return false;
        canchecks[type].push(themessage.guild.id);
        setTimeout(() => {
            canchecks[type].pop();
        }, 15000);
        return true;
    },
    size: (obj) => {
        let size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    },
};

module.exports = functions;