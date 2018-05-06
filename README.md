# Factom Node Monitor and Alert

This scirpt monitors the state of your remote Factom node. In the event that factomd hangs or the blockchain stalls, the script uses Twilio to make a telephone call directly to a number of your choice. Note, you must have a Twilio account to use this script.

### Installing on Ubuntu

Install node.js and npm if you do not already have them:

```
sudo apt install npm
```

Navigate to the node-monitor folder then install the script:

```
npm install -g
```

## Running

First you need to set your configuration using the following command:

```
node set-config.js
```

Once you have done that, your configurations will be saved to config.json. If you need to change your configurations, you can either alter that JSON directly or you can run the config script again. Note that if you decide to run the script again, it will write over everything, so make sure you enter all your configurations.

Make sure your factomd instance is running. Then type:

```
node monitor.js
```
Monitor.js will keep running, regardless of whether your node crashes or the blockchain stalls. Once your node returns to a healthy state, monitor.js will recognise that healthy state and will be ready to trigger a call again if factomd falls out of that state. There is no need to restart it.

## Built With

* [Factom Node library](https://www.npmjs.com/package/factom) designed by @PaulBernier
* [Twilio](https://www.twilio.com/) - Telephone calling utility

## Authors

* **Alex Carrithers**

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details
