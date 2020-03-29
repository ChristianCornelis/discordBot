const Discord = require('discord.js');
const config = require('./config.json')
const constants = require('./constants.json')
const client = new Discord.Client();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

let state = constants.WAITING;
let serviceType = constants.WAITING;
let userInfo = {};
let lastCollected = '';
client.on('message', msg => {
  if (msg.content === '!service') {
    msg.reply('What kind of service would you like?\nAllowable options include `taxi`, `food delivery`, `home care`, and `cleaning`.');
    state = constants.SERVICE;
  } else if (msg.content === '!cancel') {
      msg.reply('Service order cancelled!');
      state = constants.WAITING;
      serviceType = constants.WAITING;
  } else if (msg.content === '!help') {
    msg.reply("Hi, I'm ServiceBot!\nTo start a service booking with me, use `!service`.\nTo cancel a service booking at anytime, use `!cancel`.");
  } else if (msg.content === constants.MENTION) {
    msg.reply('Hey there! Valid commands to start a conversation with me are `!service` or `!help`');
  } else if (state === constants.SERVICE && msg.author.username !== 'ServiceBot') {
    if (msg.content.toLowerCase() === 'taxi') {
      serviceType = constants.TAXI;
      state = constants.COLLECTING;
      respondToServiceSelection(msg);
    } else if (msg.content.toLowerCase() === 'food delivery' || msg.content.toLowerCase() === 'food' || msg.content.toLowerCase() === 'delivery') {
      serviceType = constants.FOOD_DELIVERY;
      state = constants.COLLECTING;
      respondToServiceSelection(msg);
    } else if (msg.content.toLowerCase() === 'cleaning') {
      state = constants.COLLECTING;
      serviceType = constants.CLEANING;
      respondToServiceSelection(msg);
    } else if (msg.content.toLowerCase() === 'home care' || msg.content.toLowerCase() === 'care' || msg.content.toLowerCase() === 'home') {
      state = constants.COLLECTING;
      serviceType = constants.HOME_CARE;
      respondToServiceSelection(msg);
    } else {
      msg.reply('Please enter a valid choice.');
    }
  } else if (state === constants.COLLECTING && msg.author.username !== 'ServiceBot') {
      if (lastCollected === ''){
        userInfo['firstName'] = msg.content;
        lastCollected = 'first'
        msg.reply('What is your last name?')
      } else if (lastCollected === 'first') {
        userInfo['lastName'] = msg.content;
        lastCollected = 'lastName';
        msg.reply('What is your street address?')
      } else if (lastCollected === 'lastName') {
        userInfo['streetAddress'] = msg.content;
        lastCollected = 'streetAddress';
        msg.reply('What city are you in?');
      } else if (lastCollected === 'streetAddress') {
        userInfo['city'] = msg.content;
        lastCollected = 'city';
        msg.reply('What is your email address?');
      } else if (lastCollected === 'city') {
        userInfo['email'] = msg.content;
        lastCollected = 'email';
        msg.reply('What is your phone number?');
      } else if (lastCollected === 'email') {
        userInfo['phone'] = msg.content;
        lastCollected = 'phone';
        msg.reply(`What day do you require the ${serviceType.toLowerCase().replace('_', ' ')}?`);
      } else if (lastCollected === 'phone') {
        userInfo['date'] = msg.content;
        lastCollected = 'date';
        msg.reply(`What time do your require the ${serviceType.toLowerCase().replace('_', ' ')}?`);
      } else if (lastCollected === 'date') {
        userInfo['time'] = msg.content;
        lastCollected = 'time';
        msg.reply(`Thank you ${userInfo.firstName}, your ${serviceType.toLowerCase().replace('_', ' ')} service provider will be arriving at ${userInfo.time} on ${userInfo.date}!`);
        state = constants.WAITING;
        serviceType = constants.WAITING;
        console.log(userInfo);
      }
    }
    console.log(state);
    console.log(serviceType);
});

function respondToServiceSelection (msg) {
  let noun = "";
  switch(serviceType){
    case constants.CLEANING:
      noun = 'a cleaner';
      break;
    case constants.FOOD_DELIVERY:
      noun = 'some food';
      break;
    case constants.TAXI:
      noun = 'a taxi';
      break;
    case constants.HOME_CARE:
      noun = 'a carer';
      break;

  }

  msg.reply(`Okay, I'll get ${noun} to you soon! I just need some information from you first.\nWhat is your first name?`)
};

client.login(config.token);