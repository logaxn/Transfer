/* eslint no-unused-vars : "off" */

const fs = require('fs');
const functions = require('../modules/functions.js');

exports.run = async (guild, message, args, obj) => {
    console.log(obj);
    console.log(Date.now());
    let collection = {};
    if (message && message.premium && args[0]) collection.backupname = args.join(' ');
    else collection.backupname = null;
    if (guild.guild) {
        message = guild;
        guild = guild.guild;
    }
    let backups = [];
    let date;
    if (!obj || !obj.time) {
        date = new Date();
        date = (new Date(date.getFullYear(), date.getMonth(), date.getDate())).getTime();
    } else date = obj.time;
    if (fs.existsSync(`./ServerBackups/${guild.id}.json`)) backups = JSON.parse(fs.readFileSync(`./ServerBackups/${guild.id}.json`)).filter(back => back[0] != date);
    if (backups.filter(back => back[1].backupname && back[1].backupname == collection.backupname)[0]) return functions.notify(message, 'ERROR: That name is already taken as a backup.');
    let backup = [date];
    collection.name = guild.name;
    collection.region = guild.region;
    collection.afkTimeout = guild.afkTimeout;
    collection.verificationLevel = guild.verificationLevel;
    collection.explicitContentFilter = guild.explicitContentFilter;
    collection.mfaLevel = guild.mfaLevel;
    collection.icon = guild.iconURL();
    collection.afkChannelID = guild.afkChannelID;
    collection.emojis = [];
    for (let [id, emoji] of guild.emojis) {
        if (emoji.url) {
            collection.emojis.push({
                name: emoji.name,
                url: emoji.url,
                id: emoji.id,
            });
        }
    }
    collection.channels = [];
    for (let [id, channel] of guild.channels) {
        collection.channels.push({
            name: channel.name,
            type: channel.type,
            parent: channel.parent ? channel.parent.id : 'none',
            permissionOverwrites: channel.permissionOverwrites.array(),
            topic: channel.topic,
            nsfw: channel.nsfw,
            id: channel.id,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            position: channel.position,
        });
    }
    collection.roles = [];
    for (let [id, role] of guild.roles.sort((a, b) => b.position - a.position)) {
        if (role.id != guild.id) {
            collection.roles.push({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions,
                mentionable: role.mentionable,
                id: role.id,
            });
        }
    }
    if (!obj || obj.members.length == 0) {
        if (!message.guild) console.log(message);
        let mems = await message.guild.members.fetch().catch(() => { });
        if (!mems) functions.notify(message, 'WARNING: Unable to fetch all members of the server, so they will be left out of this backup.');
        else {
            collection.bots = [];
            collection.members = mems.map(user => {
                if (user.user.bot) collection.bots.push(user.id);
                return [user.id, user.roles.filter(role => role.id != message.guild.id).map(role => role.id)];
            });
        }
    } else collection.members = obj.members;
    let bans = await message.guild.fetchBans().catch(() => { });
    collection.bans = [];
    if (bans) {
        for (let [snow, info] of bans) {
            collection.bans.push([info.user.id, info.reason]);
        }
    } else functions.notify(message, 'ERROR: Unable to fetch bans so they will be left out.');
    if (obj && obj.index && obj.time) backup[0] = obj.time;
    backup.push(collection);
    if (obj && obj.index && obj.time) backups.splice(obj.index, 1, backup);
    else {
        backups.unshift(backup);
        backups.length = backups.length > 7 ? 7 : backups.length;
    }
    fs.writeFileSync(`./ServerBackups/${guild.id}.json`, JSON.stringify(backups));
    if (!obj || !obj.time) {
        let datey = new Date();
        if (!collection.backupname) functions.notify(message, `Backup for ${datey.getMonth() + 1}/${datey.getDate()} created successfully.`);
        else functions.notify(message, `Backup ${collection.backupname} for ${datey.getMonth() + 1}/${datey.getDate()} created successfully.`);
    } else if (obj && obj.members.length == 0) functions.notify(message, `I have created another updated backup for this server under the same date in case you wish to auto rebuild any missing users.`);
};