const functions = require(`../modules/functions.js`);

exports.run = function (message, guild, args) {
    if (!args[0]) return functions.notify(message, 'ERROR: no prefix specified');
    guild.updateItem('prefix', args[0]).then(() => {
        functions.notify(message, 'Successfully changed prefix to ' + args[0], 60);
    }).catch(err => { functions.notify(message, 'ERROR: Unable to update your settings: ' + err); });
};