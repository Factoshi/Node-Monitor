const axios = require('axios')

const config = require('./config')

// twilio library and account login details
const accountSid = config.SID;
const authToken = config.token;
const Twilio = require('twilio');
const client = new Twilio(accountSid, authToken);

// the number of retries made since node failure
// length of time (ms) between each attempt to call the node
// length of time (ms) after which blockchain is assumed to have stalled
let retryCount = 0,
    interval = 15000,
    stallTime = 1200000;

// object to store blockchain state and time first seen by this script
let lastBlock = {
    blockHeight: 1,
    timeStamp: 0,
};

console.log(`Started monitoring host: ${config.host}`)

/* this function takes the details given from twilio and will make a telephone call
to the given operator */

function callMe(fault) {
    client.api.calls
        .create({
            url: config.voiceUrl,
            to: config.to,
            from: config.from
        })
        .then(call => console.log(call.sid))
        .done();
    console.log("Alerting contact via voice call");
    nodeOffline(fault);
}

// function to test whether a node is live
function testNodeStatus() {
// setInterval calls the 'heights' method on the factomd remote host. time taken from interval var
    let testInterval = setInterval( async() => {
        try {
            let db = await axios.get(`http://${config.host}/factomdBatch?batch=myHeight`);
            debugger
/* check to see if the most recent factomd api call found a new directory block height
if a new directly block height is found, update the lastBlock object */
            if (db.data[0].Height > lastBlock.blockHeight) {
                lastBlock.blockHeight = db.data[0].Height;
                lastBlock.timeStamp = Date.now();
                console.log("New block height found:", lastBlock.blockHeight);
            }
/* if no new directory block height is found, check the length of time since the last block.
where more than var stallTime has elapsed, assume a stall and calls the callMe function */
            else if (db.data[0].Height === lastBlock.blockHeight) {
                let elapsedTime = Date.now() - lastBlock.timeStamp,
                    humanTime = millisToMinutesAndSeconds(elapsedTime);
                if (elapsedTime > 1500000) { // if 25 minutes since last block
                    console.log("Block", lastBlock.blockHeight, "first seen", humanTime, "minutes ago");
                }
                if (elapsedTime > stallTime) {
                    console.log("Blockchain has stalled...");
                    clearInterval(testInterval);
                    callMe("stall");
                }
            }
        }
// if the call to the factomd api fails, the catch block triggers the callMe() function
        catch(e) {
            if (lastBlock.timeStamp == 0) {
                console.log("Start the node before running this script");
            }
            else {
                clearInterval(testInterval);
                retry();
            }
        }
    }, interval);
}

/* function called on connection failure. retries the factom api 3 times.
if those attempts fail, callMe() is called */
function retry() {
    setTimeout( async() => {
// if a try succeeds, retryCount resets to 0 and testInterval continues
        try {
            let db = await axios.get(`http://${config.host}/factomdBatch?batch=myHeight`)
            console.log("Connection successful.");
            retryCount = 0;
            testNodeStatus();
        }
        catch(e) {
// the first catch conditional tests retryCount, where less than 3 retries, retry
            if (retryCount < 3) {
                console.log("Connection failed: trying again");
                retryCount++
                retry();
            }
// where all retries have failed, callMe and clear all intervals
            else if (retryCount == 3) {
                retryCount = 0;
                callMe("hang");
            }
        }
    }, interval);
}

// function checks the status of an offline node. Fault type is passed in from callMe() function
function nodeOffline(fault) {
    let faulted = Date.now();
// gets human readable time since stall given in minutes and seconds
    function getTimeSinceFault() {
        let timeOffline = Date.now() - faulted,
            timeOfflineHuman = millisToMinutesAndSeconds(timeOffline);
        return timeOfflineHuman;
      }
/* if the node has hung, log the status of the node every 60 seconds. When the node
comes back online, break the loop and jump back to the testNodeStatus() function */
    if (fault == "hang") {
        let hangingInterval = setInterval( async() => {
            try {
                let db = await axios.get(`http://${config.host}/factomdBatch?batch=myHeight`);
                console.log("Node online. Total time offline:", getTimeSinceFault(), "minutes");
                clearInterval(hangingInterval);
                db.data[0].Height > lastBlock.blockHeight ? testNodeStatus() : nodeOffline("stall"),
                console.log("Monitor.js will report node as stalled until blockchain progresses following boot");
            }
            catch(e) {
                console.log("Node offline for", getTimeSinceFault(), "minutes");
            }
        }, 60000);
    }
/* if the node has stalled, wait for the block height to begin increasing again. When
that happens, break the loop and jump back to the testNodeStatus() function */
    else if (fault == "stall") {
        let stallInterval = setInterval( async() => {
            try {
                let db = await axios.get(`http://${config.host}/factomdBatch?batch=myHeight`);
                if (db.data[0].Height > lastBlock.blockHeight) {
                    console.log("Blockchain live again. Total time stalled:", getTimeSinceFault(), "minutes");
                    clearInterval(stallInterval);
                    testNodeStatus();
                }
                else {
                  console.log("Node stalled for", getTimeSinceFault(), "minutes");
                }
            }
// if the stall conditional fails to contact the node, return the hang conditional
            catch(e) {
                clearInterval(stallInterval);
                console.log("Failed to contact stalled node...");
                nodeOffline("hang");
            }
        }, 60000);
    }
}

// convert unix time to minutes and seconds
function millisToMinutesAndSeconds(millis) {
    let minutes = Math.floor(millis / 60000),
        seconds = ((millis % 60000) / 1000).toFixed(0);
    return (seconds == 60 ? (minutes+1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
}

testNodeStatus()
