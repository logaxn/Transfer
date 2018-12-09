const commands = [
    {
        name: 'authorize',
        perm: function (message) {
            return message.member.roles.has('489771644269756432');
        },
    },
    {
        name: 'backup',
        perm: function (message) {
            return message.member.permissions.has('ADMINISTRATOR') || message.author.id == '198536269586890752';
        },
    },
    {
        name: 'rebuild',
        perm: function (message) {
            return message.member.permissions.has('ADMINISTRATOR') || message.author.id == '198536269586890752';
        },
    },
    {
        name: 'find',
        perm: function (message) {
            return message.guild.id == '488781868666454029';
        },
    },
    {
        name: 'prefix',
        perm: function (message) {
            return message.member.permissions.has('ADMINISTRATOR') || message.author.id == '198536269586890752';
        },
    },
    {
        name: 'reload',
        perm: function (message) {
            return message.author.id == '198536269586890752';
        },
    },
    {
        name: 'eval',
        perm: function (message) {
            return message.author.id == '198536269586890752';
        },
    },
    {
        name: 'export',
        perm: function (message) {
            return message.member.permissions.has('ADMINISTRATOR') || message.author.id == '198536269586890752';
        },
    },
    {
        name: 'wipe',
        perm: function (message) {
            return message.author.id == '198536269586890752';
        },
    },
];

const Discord = require('discord.js');

let full = new Discord.Collection();
for (let k of commands) {
    full.set(k.name, k.perm);
}
module.exports = full;