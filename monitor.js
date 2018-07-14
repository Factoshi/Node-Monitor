const axios = require('axios');

function Node(node) {
    this.ip = node.ip;
    this.port = node.port;
    this.priority = node.priority;
    this.name = node.name;
}

Node.prototype.checkStatus = async function() {
    for (let i = 0; i < 10; i++) {
        try {
            const nodeApiData = await axios.get(`http://${this.ip}:${this.port}/factomdBatch?batch=myHeight`);
            return nodeApiData;
        } catch(err) {
            await wait(5000);
        }
    }
    return null;
};

Node.prototype.makeCallViaTwilio = async function() {

};

function wait(x) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), x);
    });
}

async function monitor() {

}
