# Factom Node Monitor and Alert

This scirpt monitors the state of your remote Factom node. In the event that factomd hangs or the blockchain stalls, the script uses Twilio to make a telephone call directly to a number of your choice. Note, you must have a Twilio account to use this script.

### Installing on Ubuntu

Install node.js and npm if you do not already have them:

```
sudo apt install npm
```

Install the Factom NPM library

```
npm install --save factom
```

Install Twilio

```
npm install --save twilio
```

Clone Factom Node Monitor, then open monitor.js in a text editor. Get your Twilio login details from the Twilio website and put them in the following place:

```
const accountSid = 'XXXXX';
const authToken = 'XXXXX';
```
Next fill in your telephone information. Use the number provided by Twilio in the 'from' field, and your target phone number in the 'to' field:

```
url: 'http://demo.twilio.com/docs/voice.xml',
to: '+XXXX',
from: '+XXXX',
```

Finally, fill in your node information. Leave the host and port fields blank demoing the script on a local host with factomd on port 8088. Otherwise, fill in the IP address of your remote host and the port to call factomd on (default 8088):

```
const cli = new FactomCli({
    host: 'HOST_IP_HERE',
    port: 8088
```

## Running

Now, make sure your factomd instance is running. Open your command line prompt and navigate to the enclosing folder. Then to run, type:

```
node monitor.js
```

## Built With

* [Factom Node library](https://www.npmjs.com/package/factom) designed by @PaulBernier
* [Twilio](https://www.twilio.com/) - Telephone calling utility

## Authors

* **Alex Carrithers**

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
