const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const config = require('./config');



const url = config.mongoUrl;
const connect = mongoose.connect(url);


connect.then((db) => {
  console.log("Bien connecté !!!!!!!!!!!!");
  
}, (err) => { console.log(err); });

module.exports = connect;