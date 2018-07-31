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

    async monitor() {
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
    }

    async checkHeight() {
        for (let i = 0; i < 10; i++) {
            try {
                const controlPanelHeight = await axios.get(`http://${this.ip}:${this.port}/factomdBatch?batch=myHeight`);
                return controlPanelHeight.data[0].Height;
            } catch(err) {
                await wait(3000);
            }
        }
        return null;
    }

    alertUser() {
        let personOnDuty = this.getPersonOnDuty();

        if (this.voice === true && Date.now() - Node.lastAlert > 300000) {
            Node.lastAlert = Date.now();
            client.api.calls
                .create({
                    url: config.twilio.voiceUrl,
                    to: personOnDuty.phoneNumber,
                    from: config.twilio.from
                })
                .done();
        }

        if (this.text === true) {
            this.textUser(
                personOnDuty,
                `${this.name} is ${this.status}. You are on duty.`
            );
        }

        if (config.twilio.alertOffDutyByText === true) {
            config.rota.forEach(person => {
                if (person.name !== personOnDuty.name) {
                    this.textUser(
                        person,
                        `${this.name} is ${this.status}. You are off duty.`
                    );
                }
            });
        }
    }

    textUser(user, msg) {
        client.messages
            .create({
                body: msg,
                to: user.phoneNumber,
                from: config.twilio.from,
            })
            .done();
    }

    getPersonOnDuty() {
        const peopleOnDuty = [];
        const today = moment().format('dddd');
        const time = moment().format('HH:mm');
        config.rota.forEach(person => {
            const onDutyToday = person.onDuty[`${today}`];
            if (onDutyToday) {
                const startTime = moment(onDutyToday.split(' - ')[0], 'HH:mm').format('HH:mm');
                const endTime = moment(onDutyToday.split(' - ')[1], 'HH:mm').format('HH:mm');
                if (startTime <= time && endTime >= time) {
                    peopleOnDuty.push(person);
                }
            }
        });

        if (peopleOnDuty.length > 0) {
            return this.determinePriority(peopleOnDuty);
        } else {
            return this.determinePriority(config.rota);
        }
    }

    determinePriority(contactArray) {
        return contactArray.reduce((highestPriority, currentPerson) => {
            if (currentPerson.priority > highestPriority.priority) {
                return highestPriority = currentPerson;
            }
            return highestPriority;
        });
    }
}

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
