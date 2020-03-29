const Discord = require('discord.js');
const config = require('./config.json')
const client = new Discord.Client();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

let state = constants.WAITING;
client.on('message', msg => {
    console.log(msg);
    console.log(state);
  if (msg.content === '!service') {
    msg.reply('What kind of service would you like?');
    state = constants.GETTING_SERVICE;
    console.log(state);
  } else if (msg.content === '!cancel') {
      msg.reply('Service order cancelled!');
      state = constants.WAITING;
      console.log(state);
  } else if (msg.content.toLowerCase() === 'taxi' && state === constants.GETTING_SERVICE) {
      state = constants.GETTING_TAXI;
      msg.reply("Okay, we'll get you a taxi right away!");
  }
});

client.login(config.token);