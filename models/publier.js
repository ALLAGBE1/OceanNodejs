var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var publierSchema = new Schema({
    imagepublier: {  // Si vous stockez le chemin du fichier
      type: String,
      default: ''
    }
}, {
    timestamps: true
});


const Publiers = mongoose.model('Publier', publierSchema);
module.exports = Publiers;
