const commands = require('../commands/commands.js');
const functions = require('../modules/functions.js');
const Discord = require('discord.js');
const connect = require('../modules/connect.js');
const fs = require('fs');

let channels = new Discord.Collection();

setInterval(() => {
    for (let [id, chan] of channels) {
        fs.writeFileSync(`./channels/${id}.json`, JSON.stringify(chan));
    }
}, 15000);

exports.run = async message => {
    if (!message.guild) return;
    let settings = await connect.getSettings(message.guild.id);
    if (!settings.private) {
        let channel = channels.get(message.channel.id);
        if (!channel) {
            if (fs.existsSync(`./channels/${message.channel.id}.json`)) channel = require(`../channels/${message.channel.id}.json`);
            else channel = [];
        }
        let day = Math.floor(message.createdTimestamp / 86400000);
        let now = Date.now();
        channel = channel.filter(msg => {
            let today = Math.floor(now / 86400000);
            return (today - msg[1].day) < 7;
        });
        let obj = {
            mid: message.id,
            uid: message.author.id,
            content: message.content,
            stamp: message.createdTimestamp,
            attach: message.attachments[0] ? message.attachments.map(attach => attach.url) : null,
            day: day,
            edited: message.edits.length > 1,
        };
        if (message.embeds[0] && message.embeds[0].type == 'rich') {
            let embed = message.embeds[0];
            obj.embed = {
                title: embed.title,
                description: embed.description,
                color: embed.color,
                timestamp: embed.timestamp,
                thumbnail: embed.thumbnail ? embed.thumbnail.url : null,
                image: embed.image ? embed.image.url : null,
                fields: embed.fields,
                author: {
                    name: embed.author.name,
                    iconURL: embed.author.iconURL,
                    url: embed.author.url,
                },
                footer: {
                    text: embed.footer.text,
                    iconURL: embed.footer.iconURL,
                },
            };
        }
        channel.push([message.id, obj]);
        channels.set(message.channel.id, channel);
    }
    if (message.content == '!prefix?') functions.notify(message, `Your prefix is ${settings.prefix}`);
    if (!message.content.startsWith(settings.prefix)) return;
    let args = message.content.replace(settings.prefix, '').split(' ');
    let cmd = args.shift();
    if (cmd == 'ping') {
        let oldping = new Date();
        functions.notify(message, 'Pong\n``Time: ' + (oldping.getTime() - message.createdTimestamp) + ' Milliseconds``', 15);
    }
    if (!commands.get(cmd)) return;
    try {
        if (commands.get(cmd)(message)) require(`../commands/${cmd}.js`).run(message, settings, args);
    } catch (err) {
        functions.notify(message, 'ERROR: Command ' + cmd + ' failed to execute due to an error: ' + err + '\nPlease report this to the developer.');
        return console.log(err.stack);
    }
};