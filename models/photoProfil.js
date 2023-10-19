const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var photoProfilSchema = new Schema({
    photoProfil:  {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});

var PhotoProfils = mongoose.model('PhotoProfil', photoProfilSchema);

module.exports = PhotoProfils;