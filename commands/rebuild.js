const fs = require('fs');
const { notify } = require('../modules/functions.js');
const Discord = require('discord.js');

const inprogress = {};

exports.run = async (message, settings, args) => {
    if (args[0] == '?') return notify(message, 'Please provide, list, preview, a month day pair or leave blank for latest backup. You can also provide an id after list or preview to preview another server\'s backups.');
    if (inprogress[message.guild.id]) return notify(message, 'ERROR: Rebuild in progress!');
    let clean = args[0] == 'clean';
    if (clean) args.shift();
    let num = !isNaN(args[0]) ? args[0] : args[1];
    let id = !isNaN(num) && num.length > 16 ? num : message.guild.id;
    if (!fs.existsSync(`./ServerBackups/${id}.json`)) return notify(message, 'ERROR: No backups found.');
    let data = JSON.parse(fs.readFileSync(`./ServerBackups/${id}.json`));
    let type = null;
    let backup = data[0];
    if (args[0] == 'list' || args[0] == 'preview') type = args.shift();
    if (id != message.guild.id) args.shift();
    if (args[0]) {
        if (args[0].match(/\d{1,2}\/\d{1,2}/)) {
            let date = args[0].split('/');
            date = (new Date(2018, date[0] - 1, date[1])).getTime();
            backup = data.filter(back => back[0] == date)[0];
            if (!backup) return notify(message, `ERROR: No backup found for that date.`);
        } else {
            let name = args.join(' ');
            backup = data.filter(back => back[1].backupname == name)[0];
            if (!backup) return notify(message, `ERROR: No backup under that name found.`);
        }
    }
    if (type == 'list') {
        let times = data.map(mybackup => [mybackup[0], mybackup[1].backupname]);
        let string = '';
        for (let [timestamp, name] of times) {
            let thisdate = new Date(timestamp);
            string += (name ? name + ' - ' : '') + (thisdate.getMonth() + 1) + '/' + thisdate.getDate() + '/' + thisdate.getFullYear() + '\n';
        }
        return notify(message, 'List of dates I have backups for (mm/dd/yyyy).\n' + string);
    }
    if (type == 'preview') {
        let now = Date.now();
        fs.writeFileSync(`./${now}.json`, JSON.stringify(backup));
        let msg = await message.author.send('Here is a preview of the backup for that date.', { files: [`./${now}.json`] }).catch(() => { });
        if (!msg) return notify(message, 'ERROR: Unable to dm you the preview backup.');
        return fs.unlinkSync(`./${now}.json`);
    }
    notify(message, 'Starting rebuild.');
    inprogress[message.guild.id] = true;
    let count = 0;
    backup = backup[1];
    for (let emoji of backup.emojis) {
        let current = message.guild.emojis.get(emoji.id);
        if (!current) {
            let newemoji = await message.guild.emojis.create(emoji.url, emoji.name).catch(() => { });
            if (!newemoji) {
                notify(message, 'ERROR: Unable to create emojis, possibly you are already full or I do not have permission');
                break;
            }
            count++;
        } else await current.edit({ name: emoji.name }).catch(() => { });
    }
    notify(message, `Restored ${count} emojis`);
    backup.roles = backup.roles.sort((first, second) => second.position - first.position);
    count = 0;
    let oldtonew = {};
    for (let role of backup.roles) {
        let current = message.guild.roles.get(role.id);
        if (!current) {
            let newrole = await message.guild.roles.create({
                data: {
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions,
                },
            }).catch(() => { });
            if (!newrole) {
                notify(message, 'ERROR: Unable to create role, possibly I do not have permission');
                break;
            }
            for (let chan in backup.channels) {
                for (let overwrite in backup.channels[chan].permissionOverwrites) {
                    if (backup.channels[chan].permissionOverwrites[overwrite].id == role.id) backup.channels[chan].permissionOverwrites[overwrite].id = newrole.id;
                }
            }
            oldtonew[role.id] = newrole.id;
            role.id = newrole.id;
        } else {
            await current.edit({
                name: role.name,
                color: role.color,
                mentionable: role.mentionable,
                hoist: role.hoist,
                permissions: role.permissions,
            }).catch(() => { });
            oldtonew[role.id] = role.id;
        }
        count++;
    }
    for (let role of backup.roles) {
        await message.guild.roles.get(role.id).setPosition(role.position).catch(() => { });
    }
    notify(message, `Restored ${count}/${backup.roles.length} roles`);
    message.guild.members.fetch();
    count = 0;
    let badcount = 0;
    let missingcount = 0;
    for (let [theid, roles] of backup.members) {
        let mem = message.guild.members.get(theid);
        if (mem) {
            let newroles = [];
            for (let role of roles) {
                if (oldtonew[role]) newroles.push(oldtonew[role]);
            }
            let canset = await mem.roles.set(newroles).catch(err => {
                console.log(err);
                console.log(JSON.string(err.stack));
                console.log(newroles);
            });
            if (canset) count++;
            else badcount++;
        } else missingcount++;
    }
    notify(message, `Restored the roles of ${count} members.\nI was unable to restore the roles of ${badcount} members, and ${missingcount} members are missing.`);
    count = 0;
    let parents = backup.channels.filter(chan => chan.type == 'category');
    let newparents = {};
    for (let channel of parents) {
        let current = message.guild.channels.get(channel.id);
        if (!current) {
            let chan = await message.guild.channels.create(channel.name, {
                type: channel.type,
                overwrites: channel.permissionOverwrites,
            }).catch(() => { });
            if (!chan) {
                notify(message, 'ERROR: Unable to create channel, possibly I do not have permission');
                break;
            }
            newparents[channel.id] = { id: chan.id, position: channel.position };
        } else {
            await current.edit({
                name: channel.name,
                permissionOverwrites: channel.permissionOverwrites,
                position: channel.position,
            }).catch(() => { });
            newparents[channel.id] = { id: channel.id, position: channel.position };
        }
        count++;
    }
    for (let channel in newparents) {
        await message.guild.channels.get(newparents[channel].id).setPosition(newparents[channel].position);
    }
    notify(message, `Restored ${count} categories`);
    count++;
    let channels = {};
    for (let channel of backup.channels) {
        if (channel.type != 'category') {
            let current = message.guild.channels.get(channel.id);
            if (!current) {
                let chan = await message.guild.channels.create(channel.name, {
                    type: channel.type,
                    topic: channel.topic,
                    overwrites: channel.permissionOverwrites,
                    nsfw: channel.nsfw,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    parent: newparents[channel.parent] ? newparents[channel.parent].id : null,
                }).catch(() => { });
                if (!chan) {
                    notify(message, 'ERROR: Unable to create channel, possibly I do not have permission');
                    break;
                }
                if (channel.type == 'text') {
                    if (fs.existsSync(`./channels/${channel.id}.json`)) {
                        let days = JSON.parse(fs.readFileSync(`./channels/${channel.id}.json`)).sort((last, next) => last[1].stamp - next[1].stamp);
                        let counter = 0;
                        for (let [theid, msg] of days) {
                            let embed = new Discord.MessageEmbed();
                            let content = '';
                            let author = message.client.users.get(msg.uid);
                            if (!author) author = await message.client.users.fetch(msg.uid);
                            if (msg.embed) {
                                content = msg.content + '\n\nOriginal Author: ' + author.tag + '(**' + msg.uid + '**)\nOriginal Message Id: ' + theid;
                                embed.setAuthor(msg.embed.author)
                                    .setTitle(msg.embed.title)
                                    .setDescription(msg.embed.description)
                                    .setColor(msg.embed.color)
                                    .setTimestamp(new Date(msg.embed.timestamp))
                                    .setImage(msg.embed.image)
                                    .setFooter(msg.embed.footer);
                                for (let x of msg.embed.fields) {
                                    embed.addField(x.name, x.value, x.inline);
                                }
                            } else {
                                embed.setAuthor(author.tag, author.displayAvatarURL())
                                    .setDescription(msg.content + (msg.edited ? '(Edited)' : ''))
                                    .setFooter('Message ID:' + id)
                                    .setTimestamp(new Date(msg.stamp));
                            }
                            if (counter > 50) counter = 0;
                            let success;
                            if (!msg.attach) success = await chan.send(content, { embed: embed }).catch(() => { });
                            else success = await chan.send(content, { embed: embed, files: [msg.attach] }).catch(() => { });
                            if (!success) break;
                            counter++;
                        }
                        fs.renameSync(`./channels/${channel.id}.json`, `./channels/${chan.id}.json`);
                    }
                }
                channels[chan.id] = channel.position;
                if (channel.id == backup.afkChannelID) backup.afkChannelID = chan.id;
            } else {
                await current.edit({
                    name: channel.name,
                    permissionOverwrites: channel.permissionOverwrites,
                    position: channel.position,
                    nsfw: channel.nsfw,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    parentID: newparents[channel.parent] ? newparents[channel.parent].id : null,
                }).catch(() => { });
                channels[current.id] = channel.position;
            }
            count++;

        }
    }
    for (let channel in channels) {
        let current = message.guild.channels.get(channel);
        current.setPosition(channels[channel].position);
    }
    notify(message, `Restored ${count} channels`);
    message.guild.edit({
        name: backup.name,
        region: backup.region,
        afkTimeout: backup.afkTimeout,
        explicitContentFilter: backup.explicitContentFilter,
        verificationLevel: backup.verificationLevel,
        defaultMessageNotifications: backup.defaultMessageNotifications,
        afkChannel: backup.afkChannelID,
    }).catch(() => notify(message, 'ERROR: Unable to modify the server'));
    message.guild.setIcon(backup.icon);
    if ((backup.members.length + 50) < message.guild.memberCount) {
        notify(message, 'Member deficit in excess of 50 detected, would you like to see the difference?');
        let res = await message.channel.awaitMessages(m => m.author.id == message.author.id && ['yes', 'no'].includes(m.content.toLowerCase()), { max: 1, time: 30000, errors: ['time'] }).catch(() => { });
        if (res && res.content.toLowerCase() == 'yes') {
            let deficit = backup.members.filter(mem => !message.guild.members.get(mem));
            message.author.send(deficit.join('\n'), { split: true });
        }
    }
    notify(message, `Restored Server Properties\nChecked for missing Members`);
    let bots = '';
    if (!backup.bots.push) {
        console.log(id);
        console.log(backup.bots);
    }
    for (let bot of backup.bots) {
        if (!message.guild.members.get(bot)) {
            let mybot = await message.client.users.fetch(bot);
            bots += `\n${mybot.username} (${bot})`;
        }
    }
    if (bots.length > 0) notify(message, 'List of missing bots:' + bots);
    for (let [snow, reason] of backup.bans) {
        let can = await message.guild.members.ban(snow, { reason: reason }).catch(() => { });
        if (!can) {
            notify(message, 'I do not have permission to ban users, total bans pending: ' + backup.bans.length);
            break;
        }
    }
    let index = data.findIndex(back => back[0] == backup[0]);
    require('./backup').run(message, settings, args, { index: index, time: backup[0], members: backup.members.filter(mem => message.guild.members.get(mem)) });
    notify(message, 'Restored your ban list.\nRebuild complete.');
    inprogress[message.guild.id] = false;
};