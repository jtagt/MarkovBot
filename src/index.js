const { Client } = require('discord.js');
const Ingester = require('./Ingester');
const mongoose = require('mongoose');
const IngestMessage = require('./models/IngestMessage');
const config = require('../config.json');

mongoose.connect(config.mongodb);

const client = new Client();
const ingester = new Ingester();

const lastChannel = new Map();

client.on('ready', () => {
    console.log('Bot logged in.');

    client.guilds.cache.forEach(guild => ingester.loadIngester(guild.id));
});

const chance = () => {
    const rand = Math.random();

    if (rand < 0.5) return true;
    return false;
}

client.on('message', async message => {
    if (message.content.startsWith('freaking clear')) {
        await IngestMessage.deleteMany({ guildId: message.guild.id });

        ingester.guildIngests.delete(message.guild.id);

        return message.channel.send('OK big chungus');
    }

    if (!message.guild || message.author.bot || message.content.length < 4) return;

    ingester.addMessageIngest(message.guild.id, message.content);

    const ingestGuild = ingester.guildIngests.get(message.guild.id);

    if (ingestGuild && chance() && Object.values(ingestGuild.dict).length > 500) {
        message.channel.send(ingester.generateSentence(message.guild.id));
    }
});

client.login(config.token);