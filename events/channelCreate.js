const fs = require('fs');

exports.run = async (channel) => {
    fs.writeFileSync(`./channels/${channel.id}.json`, JSON.stringify([]));
}