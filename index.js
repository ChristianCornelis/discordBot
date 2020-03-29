const Discord = require('discord.js');
const config = require('./config.json')
const constants = require('./constants.json')
const AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});  //set the region

const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const client = new Discord.Client();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
let serviceUser = '';
let state = constants.WAITING;
let serviceType = constants.WAITING;
let userInfo = {};
let lastCollected = '';
checkTableExists();

client.on('message', msg => {
  console.log(msg);
  if (msg.content === '!service' && state === constants.WAITING) {
    msg.reply('What kind of service would you like?\nAllowable options include `taxi`, `food delivery`, `home care`, and `cleaning`.');
    state = constants.SERVICE;
    serviceUser = msg.author.username;
  } else if (msg.content === '!cancel' && msg.author.username === serviceUser) {
      msg.reply('Service order cancelled!');
      state = constants.WAITING;
      serviceType = constants.WAITING;
      serviceUser = '';
  } else if (msg.content === '!help') {
    msg.reply("Hi, I'm ServiceBot!\nTo start a service booking with me, use `!service`.\nTo cancel a service booking at anytime, use `!cancel`.");
  } else if (msg.content === constants.MENTION) {
    msg.reply('Hey there! Valid commands to start a conversation with me are `!service` or `!help`');
  } else if (state === constants.SERVICE && msg.author.username !== 'ServiceBot'  && msg.author.username === serviceUser) {
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
  } else if (state === constants.COLLECTING && msg.author.username !== 'ServiceBot'  && msg.author.username === serviceUser) {
      if (lastCollected === ''){
        userInfo['firstName'] = { "S": msg.content };
        lastCollected = 'first'
        msg.reply('What is your last name?')
      } else if (lastCollected === 'first') {
        userInfo['lastName'] = { "S": msg.content };
        lastCollected = 'lastName';
        msg.reply('What is your street address?')
      } else if (lastCollected === 'lastName') {
        userInfo['streetAddress'] = { "S": msg.content };
        lastCollected = 'streetAddress';
        msg.reply('What city are you in?');
      } else if (lastCollected === 'streetAddress') {
        userInfo['city'] = { "S": msg.content };
        lastCollected = 'city';
        msg.reply('What is your email address?');
      } else if (lastCollected === 'city') {
        userInfo['email'] = { "S": msg.content };
        lastCollected = 'email';
        msg.reply('What is your phone number?');
      } else if (lastCollected === 'email') {
        userInfo['phone'] = { "S": msg.content };
        lastCollected = 'phone';
        msg.reply(`What day do you require the ${serviceType.toLowerCase().replace('_', ' ')}?`);
      } else if (lastCollected === 'phone') {
        userInfo['date'] = { "S": msg.content };
        lastCollected = 'date';
        msg.reply(`What time do your require the ${serviceType.toLowerCase().replace('_', ' ')}?`);
      } else if (lastCollected === 'date') {
        userInfo['time'] = { "S": msg.content };
        lastCollected = 'time';
        userInfo['serviceType'] = {"S" : serviceType};
        const written = writeData(userInfo);
        if (written) {
          msg.reply(`Thank you ${userInfo.firstName['S']}, your ${serviceType.toLowerCase().replace('_', ' ')} service provider will be arriving at ${userInfo.time['S']} on ${userInfo.date['S']}!`);
        } else {
          msg.reply(`Sorry ${userInfo.firstName['S']}, your ${serviceType.toLowerCase().replace('_', ' ')} request could not be processed. Please try again.`);
        }
        
        state = constants.WAITING;
        serviceType = constants.WAITING;
        serviceUser = '';
        console.log(userInfo);
      }
    }
    console.log(state);
    console.log(serviceType);
});

/**
 * Function to respond to a service type selection.
 * @param {*} msg 
 */
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

/**
 * Method to check if the dynamoDB table exists for storing data. If not, it will create the table.
 */
function checkTableExists() {
  ddb.listTables((err, data) => { 
    if (err) {
      console.log('Error', err.code);
    } else {
      console.log('Table names are ', data.TableNames);
      if (!data.TableNames.includes(constants.TABLE_NAME)){
        console.log("Creating DynamoDB table...");
        ddb.createTable(constants.TABLE_PARAMS, (err, data) => {
          if (err) {
            console.log("Error when creating table", err);
          } else {
            console.log("Table successfully created!");
            // console.log(ddb.describeTable(constants.TABLE_NAME));
          }
        });
      } else {
        console.log("Table exists!");
        // console.log(ddb.describeTable(constants.TABLE_NAME));
      }
    }
  });
}

/**
 * Method to write user data to dynamoDB
 * @param {*} data 
 * @returns true if successful, false otherwise
 */
function writeData(data) {
  const params = {
    "TableName": constants.TABLE_NAME,
    "Item": data
  };

  ddb.putItem(params, (err, data) => {
    if (err) {
      console.log("Error writing data to table ", err);
      return false;
    } else {
      console.log("Data successfully written to table");
      return true;
    }
  });
  return true;
}
client.login(config.token);