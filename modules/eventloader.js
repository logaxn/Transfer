const connect = require('../modules/connect.js');
const fs = require('fs');

const reqevent = (event) => require(`../events/${event}.js`);

module.exports = bot => {
    bot.on('message', message => {
        if (message.author.bot) return;
        reqevent('message').run(message);
    });
    bot.on('messageUpdate', (oldmsg, newmsg) => {
        if (newmsg.author.bot) return;
        reqevent('message').run(newmsg);
    });
    bot.on('guildCreate', async guild => {
        connect.getSettings(guild.id);
        require('../commands/backup.js').run(guild);
        for (let [id, chan] of guild.channels.filter(cha => cha.type == 'text' && cha.permissionsFor(bot.user.id).has('VIEW_CHANNEL'))) {
            let channel = [];
            (await chan.messages.fetch({ limit: 100 })).map(msg => {
                let day = msg.createdTimestamp - (msg.createdTimestamp % 86400000);
                if (((Date.now() % 86400000) - day) / 86400000 > 7) return false;
                let obj = {
                    mid: msg.id,
                    uid: msg.author.id,
                    content: msg.content,
                    stamp: msg.createdTimestamp,
                    attach: msg.attachments[0] ? msg.attachments.map(attach => attach.url) : null,
                    day: day,
                    edited: msg.edits.length > 1,
                };
                if (msg.embeds[0] && msg.embeds[0].type == 'rich') {
                    let embed = msg.embeds[0];
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
                if (obj.content != '' || obj.embed) channel.push([msg.id, obj]);
            });
            fs.writeFileSync(`./channels/${id}.json`, JSON.stringify(channel));
        }
    });
    bot.on('ready', () => {
        reqevent('ready').run(bot);
    });
};