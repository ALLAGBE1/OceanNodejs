var mongoose = require('mongoose');
const connect = require('../db');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
const { File } = require('../db');



// Schéma utilisateur avec la référence à l'ID du fichier
var User = new Schema({
    nomprenom: {
      type: String,
        default: ''
    },
    email: {
      type: String,
        default: ''
    },
    // email: {
    //   type: String,
    //   unique: true, // Pour s'assurer que l'email est unique
    //   required: true // L'email est obligatoire
    // },
    nomcommercial: {
      type: String,
        default: ''
    },
    domaineactivite: {
      type: String,
        default: ''
    },
    facebookId: String,
    admin:   {
        type: Boolean,
        default: false
    },
    prestataire:   {
      type: Boolean,
      default: false
    },
    documentfournirId: {  // Si vous stockez le chemin du fichier
      type: String,
      default: ''
    }
    // Si vous utilisez GridFS :
    // documentfournirId: {  
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'File'
    // }
}, {
    timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
