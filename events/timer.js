const connect = require('../modules/connect');
const fs = require('fs');

let bot;
setTimeout(() => {
    setInterval(() => {
        bot.guilds.map(async guild => {
            let data = await connect.getSettings(guild);
            let latestBackup = JSON.parse(fs.readFileSync(`./${guild.id}.json`))[0][0];
            let dateOfBackup = new Date(latestBackup);
            let now = new Date();
            let difference = dateOfBackup.getDate() > now.getDate() ? now.getDate() + 30 : now.getDate() - dateOfBackup.getDate();
            if (difference > 7 && data.reminder < now.getTime()) {
                let role = guild.roles.highest;
                if (role.permissions.has('ADMINISTRATOR')) {
                    for (let [, mem] of role.members) {
                        mem.send(`Your last back up was ${difference} days ago, back up again?'`).catch(() => { });
                    }
                }
                data.updateItem('reminder', new Date(now.getFullYear(), now.getMonth(), now.getDate() + data.odd ? 3 : 4));
            }
        });
    }, 86400000);
}, Date.now() % 86400000);

exports.initialize = (client) => {
    bot = client;
};