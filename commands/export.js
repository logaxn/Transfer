const Discord = require('discord.js');
const util = Discord.Util;
const fs = require('fs');

exports.run = async (message, guild, args) => {
    let basehtml = fs.readFileSync('./backupbase.html', { encoding: 'utf8' });
    basehtml = basehtml.replace(/%guildname%/g, message.guild.name).replace(/%channelname%/g, message.channel.name).replace('%icon%', message.guild.iconURL({ format: 'png' }));
    let all = await fetchall(message.channel, message);
    all = all.sort((last, first) => {
        return last.createdTimestamp - first.createdTimestamp;
    })
    let string = await buildHTML(message.channel, all, basehtml);
    string = string.replace('%count%', all.size);
    string += `    </div>
    </body>
    </html>`
    let name = message.guild.name + '_-_' + message.channel.name;
    fs.writeFileSync(`./${name}.html`, string);
    await message.channel.send({ files: [`./${name}.html`] });
    fs.unlinkSync(`./${name}.html`);
}
function getdate(date) {
    let day = date.getDate();
    let month = getmonth(date.getMonth());
    let year = date.getFullYear().toString().slice(2);
    let time = date.getHours() > 11 ? 'pm' : 'am';
    let hour = time == 'pm' ? date.getHours() - 12 : date.getHours();
    let minutes = date.getMinutes();
    let datestring = `${day}-${month}-${year} ${hour > 9 ? '' : '0'}${hour}:${minutes > 9 ? '' : '0'}${minutes} ${time} `
    return datestring;
}

function getmonth(month) {
    switch (month) {
        case (0): return 'Jan';
        case (1): return 'Feb';
        case (2): return 'Mar';
        case (3): return 'Apr';
        case (4): return 'May';
        case (5): return 'Jun';
        case (6): return 'Jul';
        case (7): return 'Aug';
        case (8): return 'Sep';
        case (9): return 'Oct';
        case (10): return 'Nov';
        case (11): return 'Dec';
    }
}
function hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',1)';
    }
    return 'rgba(79,84,92,255)'
}

function cleantext(client, string) {
    let args = string.split(' ').filter(arg => arg.startsWith('https://'));
    for (let url of args) {
        string.replace(url, `<a href="${url}">${url}</a>`)
    }
    let emojis = string.split(' ').filter(arg => {
        let stuff = util.parseEmoji(arg);
        if (stuff) return stuff.id
    })
    for (let emoji of emojis) {
        let theemoji = client.emojis.get(emoji.name);
        if (theemoji) string = string.replace(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/, `<img class="emoji" title="${emoji.name}" src="${theemoji.url}">`)
    }
    return string.replace(/&/g, '&amp;').replace(/[^\d]>/g, '&gt;').replace(/<[^[@|#]]/g, '&lt;').replace(/\\n/g, '\n<br>\n');
}
function parsementions(message, string) {
    for (let [id, mention] of message.mentions.members) {
        let regex = new RegExp(`${mention}`, 'g');
        string = string.replace(regex, `<span class="mention" title="${mention.user.tag}">@${mention.member ? mention.member.displayName : mention.user.username}</span>`);
    }
    for (let [id, mention] of message.mentions.channels) {
        let regex = new RegExp(`${mention}`, 'g');
        string = string.replace(regex, `<span class="mention">#${mention.name}</span> `)
    }
    return string;
}
async function fetchall(channel, before) {
    let messages = await channel.messages.fetch({ limit: 100, before: before.id });
    if (!messages.last()) return messages;
    newcollection = messages.concat(await fetchall(channel, messages.last()))
    return newcollection;
}
function buildHTML(channel, messages, string) {
    let sameauthor;
    for (let [id, message] of messages) {
        if (sameauthor != message.author.id) {
            sameauthor = undefined;
            string += `            </div>
            </div>`
        }
        let content = parsementions(message, cleantext(channel.client, message.content));
        if (!sameauthor) {
            string += `        <div class="chatlog__message-group">
            <div class="chatlog__author-avatar-container">
                <img class="chatlog__author-avatar" src="${message.author.displayAvatarURL()}">
            </div>
            <div class="chatlog__messages">
                <span class="chatlog__author-name" title="${message.author.tag}">${message.member.displayName}</span>
                <span class="chatlog__timestamp">${getdate(message.createdAt)}</span>`
            sameauthor = message.author.id;
        }
        string += `                <div class="chatlog__content">${content}        </div>`;
        let theembed = message.embeds[0];
        if (theembed) {
            string += `                <div class="chatlog__embed">
            <div class="chatlog__embed-color-pill" style="background-color: ${hexToRgbA(theembed.hexColor)}"></div>
            <div class="chatlog__embed-content-container">
                <div class="chatlog__embed-content">
                    <div class="chatlog__embed-text">`
            if (theembed.author) {
                string += `                    <div class="chatlog__embed-author">
                            <img class="chatlog__embed-author-icon" src="${theembed.author.proxyIconURL}">
                            <span class="chatlog__embed-author-name">${theembed.author.name}</span>
                        </div>`
            }
            if (theembed.title) string += `                    <div class="chatlog__embed-title">${theembed.title}</div>`
            if (theembed.description) string += `                    <div class="chatlog__embed-description">${parsementions(message, cleantext(channel.client, theembed.description))}</div>`
            if (theembed.fields[0]) {
                string += `                        <div class="chatlog__embed-fields">`
                for (let field of theembed.fields) {
                    string += `
                    console.log(string);
                            <div class="chatlog__embed-field ">
                                <div class="chatlog__embed-field-name">${parsementions(message, cleantext(channel.client, field.name))}</div>
                                <div class="chatlog__embed-field-value">${parsementions(message, cleantext(channel.client, field.description))}}</div>
                            </div>`
                }
                string += `                        </div>`
            }
            string += `
                    </div>
                </div>`
            if (theembed.thumbnail) {
                string += `                            <div class="chatlog__embed-thumbnail-container">
                                <a class="chatlog__embed-thumbnail-link" href="${theembed.thumbnail.proxyURL}">
                                    <img class="chatlog__embed-thumbnail" src="${theembed.thumbnail.proxyURL}">
                                </a>
                            </div>`
            }
            if (theembed.footer) {
                string += `                <div class="chatlog__embed-footer">
                    <span class="chatlog__embed-footer-text">${parsementions(message, cleantext(channel.client, theembed.footer.text))}</span>`
                if (theembed.footer.proxyIconURL) string += `                    <img class="chatlog__embed-footer-icon" src="${theembed.footer.proxyIconURL}">`;
                string += `                </div>`
            }
            string += `            </div >
        </div > `
        }
        let attach = message.attachments.first();
        if (attach) {
            string += `<div class="chatlog__attachment">
                <a href="${attach.proxyURL}">
                    <img class="chatlog__attachment-thumbnail" src="${attach.proxyURL}">
                    </a>
                </div>`
        }
    };
    return string;
}