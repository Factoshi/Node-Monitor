# Factom Node Monitoring and Alert Tool

This scirpt monitors the state of your local or remote Factomd node. In the event that Factomd hangs or the blockchain stalls, the script uses Twilio to make a telephone call directly to a number of your choice. Note, you must have a Twilio account to use this script.

## Installing NodeJS

First, install NodeJS on your system.

### Ubuntu

```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### MacOS

Visit the NodeJS website to download in the installer package: https://nodejs.org/en/#download

Alternatively, if you have Homebrew installed:

```
brew install node
```

## Installing the Monitoring Tool

Clone the repo into your target directory. Then, navigate into the project folder and type:

```
npm install
```

## Installing PM2 (optional but recommended)

PM2 is a process manager built for NodeJS. It is a convenient and easy way to manage the script. To install, type:

```
npm install pm2 -g
```
(Note: You need to run the above command with root permissions)

## Running

First, copy config.yaml.copy to config.yaml.

Then, fill out all of the details in config.yaml. It is important that you read the comments in the config file carefully otherwise the script may not work as expected.

Second, make sure the firewall for the control panel port is open on each target host.


### Without PM2

To run the script without PM2, make sure you're in the project's root directory then run:

```
node monitor.js
```

### With PM2

With PM2, make sure you are in the project's root directory then run:

```
pm2 start monitor.js
```

Next, save the current process list:

```
pm2 save
```

Finally, to make sure the script starts on boot, run:

```
pm2 startup
```

then follow the onscreen instructions.

## Built With

* [Twilio](https://www.twilio.com/)

## Authors

* **Alex Carrithers**

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details
