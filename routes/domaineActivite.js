const express = require('express');
const bodyParser = require('body-parser');
const DomaineActivites = require('../models/domaineActivite');

const domaineActivites = express.Router();
domaineActivites.use(bodyParser.json());

domaineActivites.route('/')
.get((req, res, next) => {
    DomaineActivites.find(req.query)
    .then((domaines) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(domaines);
    })
    .catch((err) => next(err));
})
.post((req, res, next) => {
    DomaineActivites.create(req.body)
    .then((domaine) => {
        console.log("Domaine Créée :", domaine);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(domaine);
    })
    .catch((err) => next(err));
})

module.exports = domaineActivites;