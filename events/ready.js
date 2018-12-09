exports.run = bot => {
    console.log('Online');
    bot.user.setActivity(`${bot.guilds.size} servers`, { type: 'LISTENING' });
    // require('./timer').initialize(bot);
};