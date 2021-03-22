const { model, Schema } = require('mongoose');

const schema = new Schema({
    guildId: String,
    content: String,
    timestamp: Number
});

module.exports = model('messages', schema);