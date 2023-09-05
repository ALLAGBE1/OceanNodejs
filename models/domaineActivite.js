const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const domaineActiviteSchema = new Schema({
    domaineactivite: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

const DomaineActivites = mongoose.model('DomaineActivite', domaineActiviteSchema);
module.exports = DomaineActivites;