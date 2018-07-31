const assert = require('assert');
const moment = require('moment');

class TestRota {
    constructor(config, today, time) {
        this.config = config;
        this.today = today;
        this.time = time;
        this.voice = config.node.voice,
        this.text = config.node.text,
        this.alertOffDutyByText = config.alertOffDutyByText;
        this.textRecipients = [];
        this.onDuty = {};
        this.onDuty.text = null;
        this.onDuty.voice = null;
    }

    alertUser() {
        let personOnDuty = this.getPersonOnDuty();

        if (this.voice === true) {
            this.onDuty.voice = true;
        }

        if (this.text === true) {
            this.onDuty.text = true;
        }

        if (this.alertOffDutyByText === true) {
            this.config.rota.forEach(person => {
                if (person.name !== personOnDuty.name) {
                    this.textRecipients.push(person);
                }
            });
        }
    }

    getPersonOnDuty() {
        const peopleOnDuty = [];
        const today = moment(this.today, 'dddd').format('dddd');
        const time = moment(this.time, 'HH:mm').format('HH:mm');
        this.config.rota.forEach(person => {
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
            return this.determinePriority(this.config.rota);
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

describe('Check that the script correctly parses the rota', () => {
    const config = {
        rota: [{
            name: 'Barry',
            phoneNumber: '447845609873',
            onDuty: {
                Monday: '16:00 - 23:59',
                Tuesday: '16:00 - 23:59',
                Wednesday: '16:00 - 23:59',
                Thursday: '16:00 - 23:59',
                Saturday: '16:00 - 23:59',
            },
            priority: '3',
        },
        {
            name: 'Bob',
            phoneNumber: '447845609873',
            onDuty: {
                Monday: '00:00 - 08:00',
                Tuesday: '00:00 - 08:00',
                Wednesday: '00:00 - 08:00',
                Thursday: '00:00 - 08:00',
                Friday: '00:00 - 08:00',
                Sunday: '16:00 - 23:59',
            },
            priority: '1',
        },
        {
            name: 'Bill',
            phoneNumber: '447845609873',
            onDuty: {
                Monday: '08:00 - 16:00',
                Tuesday: '08:00 - 16:00',
                Wednesday: '08:00 - 16:00',
                Thursday: '08:00 - 16:00',
                Saturday: '08:00 - 16:00',
                Sunday: '16:00 - 23:59',
            },
            priority: '2',
        },
        {
            name: 'Ben',
            phoneNumber: '447845609873',
            onDuty: {
                Monday: '16:00 - 23:59',
                Tuesday: '16:00 - 23:59',
                Wednesday: '16:00 - 23:59',
                Thursday: '16:00 - 23:59',
                Saturday: '16:00 - 23:59',
            },
            priority: '3',
        }],
        node: {
            voice: null,
            text: null
        },
    };

    it('Should select the person currently on duty', () => {
        const testRota = new TestRota(config, 'Monday', '08:00');
        const personOnDuty = testRota.getPersonOnDuty();

        assert(personOnDuty.name === 'Bill');
    });

    it('Should select the person with the highest priority when no one is on duty', () => {
        const testRota = new TestRota(config, 'Sunday', '14:00');
        const personOnDuty = testRota.getPersonOnDuty();

        assert(personOnDuty.name === 'Ben' || personOnDuty.name === 'Barry');
    });

    it('Should select only one person when two have equal priority and on duty together', () => {
        const testRota = new TestRota(config, 'Saturday', '17:00');
        const personOnDuty = testRota.getPersonOnDuty();

        assert(personOnDuty.name === 'Ben' || personOnDuty.name === 'Barry');
    });

    it('Should select the right person when two are on duty and one has higher higher priority', () => {
        const testRota = new TestRota(config, 'Sunday', '17:00');
        const personOnDuty = testRota.getPersonOnDuty();

        assert(personOnDuty.name === 'Bill');
    });

    it('Should only call the person on duty', () => {
        config.alertOffDutyByText = false;
        config.node.voice = true;
        config.node.text = false;
        const testRota = new TestRota(config, 'Sunday', '17:00');
        testRota.alertUser();

        assert(testRota.onDuty.voice === true);
        assert(testRota.onDuty.text === null);
        assert(testRota.textRecipients.length === 0);
    });

    it('Should only text the person on duty', () => {
        config.alertOffDutyByText = false;
        config.node.voice = false;
        config.node.text = true;
        const testRota = new TestRota(config, 'Sunday', '17:00');
        testRota.alertUser();

        assert(testRota.onDuty.voice === null);
        assert(testRota.onDuty.text === true);
        assert(testRota.textRecipients.length === 0);
    });

    it('Should call the person on duty and alert everyone off duty by text', () => {
        config.alertOffDutyByText = true;
        config.node.voice = true;
        config.node.text = true;
        const testRota = new TestRota(config, 'Sunday', '17:00');
        testRota.alertUser();

        assert(testRota.onDuty.voice === true);
        assert(testRota.onDuty.text === true);
        assert(testRota.textRecipients.length === 3);
    });
});
