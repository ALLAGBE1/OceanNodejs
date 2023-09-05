const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const config = require('./config');
const { createModel } = require('mongoose-gridfs');


const url = config.mongoUrl;
const connect = mongoose.connect(url);


connect.then((db) => {
  console.log("Bien connecté !!!!!!!!!!!!");
  
  // Création du modèle pour GridFS
  const File = createModel({
    modelName: 'File', 
    connection: mongoose.connection
  });
  module.exports.File = File; // Exportez le modèle File pour l'utiliser ailleurs
}, (err) => { console.log(err); });

module.exports = connect;