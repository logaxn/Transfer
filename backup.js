process.on('unhandledRejection', err => {
    console.log('Uncaught Promise Error: \n' + err.stack);
});

const { Client, Collection } = require('discord.js');
const fs = require('fs');

class client extends Client {
    constructor(opts) {
        super(opts);
        this.config = require('./config.json');
        this.servers = new Collection();
        this.aliases = new Collection();
    }
    reload(author) {
        let files;
        let types = ['autosystems', 'commands', 'generic', 'modules', 'events', 'global', 'maintence', 'timermodules'];
        for (let t of types) {
            if (fs.existsSync(`${__dirname}/${t}`)) {
                files = fs.readdirSync(`${__dirname}/${t}`);
                for (let k of files) {
                    if (!k.includes('captchas') && !k.includes('connections') && !k.includes('msgcounter')) delete require.cache[require.resolve(`${__dirname}/${t}/${k}`)];
                    if (k.includes('connect')) {
                        require('./modules/connect.js').init(this);
                    }
                }
                if (author) console.log(`Reloaded all ${t} modules.`);
            }
        }
        if (author) author.send(`Reloaded all modules.`).catch(() => { });
    }
}

const bot = new client({
    disableEveryone: true,
    disabledEvents: ['GUILD_EMOJIS_UPDATE', 'TYPING_START', 'TYPING_STOP', 'CHANNEL_PINS_UPDATE', 'EMOJICREATE', 'EMOJIDELETE', 'EMOJIUPDATE', 'USER_NOTE_UPDATE'],
});

const init = () => {
    bot.login(bot.config.token);
    require('./modules/connect.js').init(bot);
    require('./modules/eventloader.js')(bot);
};

init();

bot.on('disconnect', () => console.log('Bot is disconnected...'))
    .on('reconnect', () => console.log('Bot reconnecting...'))
    .on('error', e => console.log(e))
    .on('warn', info => console.log(info));
