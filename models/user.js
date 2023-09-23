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
    disponible:   {
      type: Boolean,
      default: true
    },
    confirmed:   {
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
    },
    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: '2dsphere'
      }
    },
}, {
    timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
