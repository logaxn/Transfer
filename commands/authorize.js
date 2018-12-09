const functions = require(`../modules/functions.js`);
const connect = require('../modules/connect.js');

exports.run = async function (message, guild, args) {
    // if (!args[0] || args[0] == '?') return functions.notify(message, lang[guild.lang].usage.authorize.replace(/%p%/g, guild.prefix));
    let inv = await message.client.fetchInvite(args[0]).catch(() => { });
    if (!inv) return functions.notify(message, 'ERROR: Unable to parse that invite.');
    let id = inv.guild.id;
    if ((await connect.querysql('backupBot', `SELECT * FROM premium WHERE guildref=${id}`))[0]) return functions.notify(message, 'ERROR: That server has already been authorized.');
    let current = await connect.querysql('backupBot', `SELECT * FROM premium WHERE userid=${message.author.id}`);
    if (current.length >= 1) return functions.notify(message, 'ERROR: You have already reached your alloted number of authorized guilds, consider !deauthorize(ing) one of them.');
    let newauth = {
        guildref: id,
        username: encodeURIComponent(message.author.tag).replace(/%20/g, ' '),
        userid: message.author.id,
    };
    connect.querysql('configs', 'INSERT INTO premium SET ?', newauth).then(() => {
        functions.notify(message, 'Successfully authorized your server.');
    }).catch(err => functions.notify(message, 'Unable to authorize your server. Error: ' + err));
};