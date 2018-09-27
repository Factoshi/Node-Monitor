const fs = require('fs');

const moment = require('moment');
const axios = require('axios');

const yaml = require('yaml-js');
const config = yaml.load(fs.readFileSync('./config.yaml'));

const Twilio = require('twilio');
const client = new Twilio(config.twilio.SID, config.twilio.authToken);

class Node {
    constructor(node) {
        this.ip = node.ip;
        this.port = node.port;
        this.name = node.name;
        this.voice = node.voice;
        this.text = node.text;
        this.height = 0;
        this.lastBlockTime = 0;
    }

    // prettier-ignore
    async evaluateNodeState() {
        const nodeHeight = await this.checkHeight();
        
        // success case
        if (nodeHeight > this.height || (nodeHeight && this.status === 'offline')) {
            this.height = nodeHeight;
            this.lastBlockTime = Date.now();
            this.status = 'online';
            console.log('\x1b[32m', `${this.name}:`, '\x1b[0m', `blockheight - ${this.height}`);
        // crash case
        } else if (!nodeHeight && this.status === 'online') {
            this.status = 'offline';
            console.log('\x1b[31m', `${this.name}:`, '\x1b[0m', `node is offline - ${this.height}`);
            this.alertPersonOnDuty();
        // stall case
        } else if (Date.now() - this.lastBlockTime > 1200000 && this.status === 'online') {
            this.status = 'stalled';
            console.log('\x1b[31m', `${this.name}:`, '\x1b[0m', `node has stalled - ${this.height}`);
            this.alertPersonOnDuty();
        // initial contact failure case
        } else if (!nodeHeight && this.height === 0 && this.status !== 'offline') {
            this.status = 'offline';
            console.log('\x1b[31m', `${this.name}:`, '\x1b[0m', `cannot make initial contact. Are you sure factomd is running and the port is open?`);
            this.alertPersonOnDuty();
        }
    }

    // prettier-ignore
    async checkHeight() {
        for (let i = 0; i < 10; i++) {
            try {
                // had to add timeout, otherwise a failed node could take an absurdly long time to trigger an alert
                const controlPanelHeight = await axios.get(`http://${this.ip}:${this.port}/factomdBatch?batch=myHeight`, {
                    timeout: 3000
                });
                return controlPanelHeight.data[0].Height;
            } catch(err) {
                // Math.pow() implements incremental back-off for node retries
                await new Promise(resolve => setTimeout(resolve, Math.pow(3, i)));
            }
        }
        return null;
    }

    alertPersonOnDuty() {
        const { name, phoneNumber } = this.getPersonOnDuty();

        console.log(`Alerting ${name} on ${phoneNumber}`);

        if (this.voice === true) {
            client.api.calls
                .create({
                    url: config.twilio.voiceUrl,
                    to: phoneNumber,
                    from: config.twilio.from
                })
                .done();
        }

        if (this.text === true) {
            client.messages
                .create({
                    body: `${this.name} is ${this.status}.`,
                    to: phoneNumber,
                    from: config.twilio.from
                })
                .done();
        }
    }

    // prettier-ignore
    getPersonOnDuty() {
        const peopleOnDuty = [];
        const now = moment().format('HH:mm');
        const today = moment().format('dddd');
        config.rota.forEach(person => {
            const personOnDutyToday = person.onDuty[today] || person.onDuty[today.toLowerCase()];
            if (personOnDutyToday) {
                const shiftStart = personOnDutyToday[0];
                const shiftEnd = personOnDutyToday[1];
                if (shiftStart <= now && shiftEnd >= now) {
                    peopleOnDuty.push(person);
                }
            }
        });

        if (peopleOnDuty.length > 0) {
            return this.determineAlertPriority(peopleOnDuty);
        } else {
            return this.determineAlertPriority(config.rota);
        }
    }

    determineAlertPriority(contactArray) {
        return contactArray.reduce((highestPerson, currentPerson) => {
            if (currentPerson.priority > highestPerson.priority) {
                return currentPerson;
            }
            return highestPerson;
        });
    }
}

async function startMonitoring() {
    config.nodes.forEach(async nodeObject => {
        const node = new Node(nodeObject);

        while (true) {
            await node.evaluateNodeState();
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    });
}

startMonitoring();
