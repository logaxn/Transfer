const functions = require(`../modules/functions.js`);
const fs = require('fs');
const connect = require('../modules/connect.js');
const beautify = require('js-beautify').js_beautify
const Discord = require('discord.js');
const request = require('superagent');

exports.run = async function (message, settings, args) {
    let code = args.join(' ');
    let bot = message.client;
    try {
        let evaled = await eval(code);
        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
        if (!clean(evaled).startsWith('wrappedPromise')) {
            if (message.guild.id == 270438133584232449 || message.guild.id == 209566902522085376) message.channel.send(`:inbox_tray: **Input**\n\`\`\`${beautify(code, { indent_size: 2 })}\`\`\`\n:outbox_tray: **Output**\n\`\`\`${clean(evaled)}\`\`\``, { split: true });
            else functions.reply(message, `:inbox_tray: **Input**\n\`\`\`${beautify(code, { indent_size: 2 })}\`\`\`\n:outbox_tray: **Output**\n\`\`\`${clean(evaled)}\`\`\``, 30);
        }
    }
    catch (err) {
        functions.reply(message, ':inbox_tray: **Input**\n```' + beautify(code, { indent_size: 2 }) + '```\n\n' + `\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``, 30);
    }
}
function clean(text) {
    if (typeof (text) === 'string') return text.replace(/`/g, '\'`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
    else return text;
}