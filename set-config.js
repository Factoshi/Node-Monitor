const fs = require('fs')

const inquirer = require('inquirer')

var questions = [
  {
    type: 'input',
    name: 'SID',
    message: 'What is your Twilio account SID?'
    },
  {
    type: 'input',
    name: 'token',
    message: 'What is your Twilio auth token?'
    },
  {
    type: 'input',
    name: 'from',
    message: 'What phone number does your alert call come from?'
    },
  {
    type: 'input',
    name: 'to',
    message: 'What phone number do you receive your alert call to?'
    },
  {
    type: 'input',
    name: 'voiceUrl',
    message: 'What is your Twilio voice URL?'
    },
  {
    type: 'input',
    name: 'textUrl',
    message: 'What is your Twilio text URL?'
    },
  {
    type: 'input',
    name: 'host',
    message: 'What is the IP address of the host you are monitoring?'
    },
  {
    type: 'input',
    name: 'port',
    message: 'Which port is factomd using on that host?'
    }
]


inquirer.prompt(questions).then(answers => {
    fs.writeFileSync('./config.json', JSON.stringify(answers))
    console.log('You can now start the monitor using `node monitor.js`')
})
