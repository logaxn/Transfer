const fs = require('fs');
const { notify, wait, deletem } = require('../modules/functions');
const lang = 'Help message in progress';

let inprogress = false;

exports.run = async function (message, guild, args) {
    if (!args[0] || args[0] == '?') return notify(message, lang);
    if (inprogress) return notify(message, 'ERROR: Find in progress already, please wait for it to complete.');
    inprogress = true;
    let name = args.join(' ');
    let f = await notify(message, 'WARNING: This lookup may take awhile to complete.');
    let all = fs.readdirSync('./ServerBackups');
    let backups;
    let backup;
    let server;
    let found = false;
    for (server of all) {
        backups = JSON.parse(fs.readFileSync('./ServerBackups/' + server));
        for (backup of backups) {
            if (backup[1].name.toLowerCase() == name.toLowerCase()) {
                found = true;
                break;
            }
        }
        if (found) break;
    }
    deletem(f);
    inprogress = false;
    if (!found) return notify(message, 'No backups were found bearing that name.');
    let times = backups.map(mybackup => [mybackup[0], mybackup[1].backupname, backup[1].name]);
    let string = '';
    for (let [timestamp, backupname, servername] of times) {
        let thisdate = new Date(timestamp);
        string += (backupname ? 'Name of Backup: ' + backupname + '\n' : '') + '**Date of Backup:** ' + (thisdate.getMonth() + 1) + '/' + thisdate.getDate() + '/' + thisdate.getFullYear() + '\n**Server Name:** ' + servername + '\n\n';
    }
    notify(message, `Here is the server info associated with the backup of that name.\nID: ${server.replace(/\D/g, '')}\n       \n${string}`);
    await wait(30);
};