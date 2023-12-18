var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var publierSchema = new Schema({
    // imagepublier: {  // Si vous stockez le chemin du fichier
    //   type: String,
    //   default: ''
    // },
    imagepublier: {  
      type: Buffer, // Changement du type à Buffer
      default: Buffer.from('') // Vous pouvez définir une valeur par défaut appropriée
  },
}, {
    timestamps: true
});


const Publiers = mongoose.model('Publier', publierSchema);
module.exports = Publiers;
