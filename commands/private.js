const functions = require('../modules/functions.js');

exports.run = (message, guild, args) => {
    let private = true;
    if (guild.private && args[0] != 'off') return functions.notify(message, 'Please attach the word \'off\' in order to turn off private mode. I will begin tracking messages immediately.');
    else if (guild.private) guild.private = false;
    guild.updateItem('private', private).then(() => {
        functions.notify(message, `Your messages are will ${guild.private == 1 ? 'no longer' : 'now'} be tracked.`);
    });
};