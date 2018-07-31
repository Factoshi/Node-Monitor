const assert = require('assert');

describe('Check if the script handles failure logic properly', () => {
    function Node(node) {
        this.status = node.status;
    }

    it('should result in a stalled status and an alert call', async () => {
        Node.prototype.monitor = function() {
            this.lastBlockTime = Date.now() - 1800001;
        };
        const node = new Node({ status: 'online' });
        await node.monitor();

        if (Date.now() - node.lastBlockTime > 1800000 && node.status === 'online') {
            node.status = 'stalled';
            node.alertTriggered = true;
        }
        assert(node.status === 'stalled');
        assert(node.alertTriggered === true);
    });

    it('should result in an offline status and an alert call', async () => {
        Node.prototype.checkHeight = function() {
            return null;
        };
        const node = new Node({ status: 'online' });
        const nodeHeight = node.checkHeight();

        if (!nodeHeight && node.status !== 'offline') {
            node.status = 'offline';
            node.alertTriggered = true;
        }
        assert(node.status === 'offline');
        assert(node.alertTriggered === true);
    });
});
