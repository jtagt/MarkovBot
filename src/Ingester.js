const Markov = require('ez-markov');
const IngestMessage = require('./models/IngestMessage');

class Ingester {
    constructor() {
        this.guildIngests = new Map();
        this.saveQueue = [];
        this.running = false;
    }

    async checkLoop() {
        if (this.saveQueue.length && !this.running) {
            this.running = true;

            while (this.saveQueue.length > 0) {
                const lastMessage = this.saveQueue.pop();

                await this.saveMessage(lastMessage[0], lastMessage[1]);
            }

            this.running = false;
        } 
    }

    async saveMessage(guildId, content) {
        try {
            await new IngestMessage({ guildId, content }).save();
        } catch (e) {
            console.log('failed', e);
        }
    }

    createIngester(guildId) {
        const ingester = new Markov();
        this.guildIngests.set(guildId, ingester);

        return ingester;
    }

    async loadIngester(guildId) {
        const ingester = this.createIngester(guildId);
        const matchingMessages = await IngestMessage.find({ guildId }).lean();

        matchingMessages.forEach(message => ingester.addCorpus(message.content));

        return true;
    }

    addMessageIngest(guildId, content) {
        let ingester = this.guildIngests.get(guildId);
        if (!ingester) ingester = this.createIngester(guildId);

        this.saveQueue.push([guildId, content]);
        this.checkLoop();

        ingester.addCorpus(content);
    }

    generateSentence(guildId) {
        const ingester = this.guildIngests.get(guildId);
        if (!ingester) {
            this.loadIngester();

            const newIngester = this.guildIngests.get(guildId);
            return newIngester.getSentence();
        }

        return ingester.getSentence();
    }
}

module.exports = Ingester;