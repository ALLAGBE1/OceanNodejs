const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ratingSchema = new Schema({
    rating:  {
        type: String,
        required: true 
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    prestataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});

var Ratings = mongoose.model('Rating', ratingSchema);

module.exports = Ratings;
