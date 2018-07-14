const fs = require('fs');

const axios = require('axios');

const yaml = require('yaml-js');
const config = yaml.load(fs.readFileSync('./config.yaml'));

const Twilio = require('twilio');
const client = new Twilio(config.twilio.SID, config.twilio.authToken);

function Node(node) {
    this.ip = node.ip;
    this.port = node.port;
    this.name = node.name;
    this.voice = node.voice;
    this.text = node.text;
    this.height = 0;
    this.lastBlockTime = 0;
}

Node.prototype.alertUser = async function() {
    if (this.voice === 'true') {
        client.api.calls
            .create({
                url: config.twilio.voiceUrl,
                to: config.twilio.to,
                from: config.twilio.from
            })
            .done();
    }

    if (this.text === 'true') {
        client.messages
            .create({
                body: `${this.name} is ${this.status}`,
                to: config.twilio.to,
                from: config.twilio.from
            })
            .done();
    }
};

Node.prototype.checkHeight = async function() {
    for (let i = 0; i < 10; i++) {
        try {
            const controlPanelHeight = await axios.get(`http://${this.ip}:${this.port}/factomdBatch?batch=myHeight`);
            return controlPanelHeight.data[0].Height;
        } catch(err) {
            await wait(3000);
        }
    }
    return null;
};

Node.prototype.monitor = async function() {
    const nodeHeight = await this.checkHeight();

    if (!nodeHeight && this.status === 'online') {
        this.status = 'offline';
        console.log('\x1b[31m', `${this.name}:`, '\x1b[0m', `node is offline - ${this.height}`);
        this.alertUser();
    } else if (Date.now() - this.lastBlockTime > 1200000 && this.status === 'online') {
        this.status = 'stalled';
        console.log('\x1b[31m', `${this.name}:`, '\x1b[0m', `node has stalled - ${this.height}`);
        this.alertUser();
    } else if (nodeHeight > this.height || (nodeHeight && this.status === 'offline')) {
        this.height = nodeHeight;
        this.lastBlockTime = Date.now();
        this.status = 'online';
        console.log('\x1b[32m', `${this.name}:`, '\x1b[0m', `blockheight - ${this.height}`);
    }
};

function wait(x) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), x);
    });
}

async function startMonitoring() {
    config.nodes.forEach(async (nodeObject) => {
        const node = new Node(nodeObject);

        while (node) {
            await node.monitor();
            await wait(30000);
        }
    });
}

startMonitoring();
