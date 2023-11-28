var express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Publiers = require('../models/publier');

const publiers = express.Router();
publiers.use(bodyParser.json());

// :::::::::::::::::::::::
// Configuration de multer pour le stockage des fichiers

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/publicites'); // Définit le répertoire de stockage
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Définit le nom du fichier
    }
  });
  
  const imageFileFilter2 = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Vous ne pouvez télécharger que des fichiers jpeg, png, gif !'), false);
    }
    cb(null, true);
  };
  
const upload = multer({ storage: storage, fileFilter: imageFileFilter2 })

publiers.route('/')
  .get((req, res, next) => {
    Publiers.find(req.query)
      .then((publicites) => {
        const transformedPublicites = publicites.map(publicite => {
          publicite = publicite.toObject();

          let imageName = publicite.imagepublier;
          publicite.afficheUrl = `${imageName}`;
          return publicite;
        })

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(transformedPublicites); // Utilisez les données transformées
      })
      .catch((err) => next(err));
  });

publiers.get('/images/:imageName', (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'public/publicites', imageName);

  // Vérifiez que le fichier image existe
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
})


// Route pour la création d'images
publiers.route('/')
.post(upload.single('imagepublier'), (req, res, next) => {
  // Le fichier sera stocké dans req.file grâce à multer

  // Construisez l'URL complète de l'image créée
  // const imageUrl = `${req.protocol}://${req.get('host')}/publier/${req.file.originalname}`;
  const imageUrl = `https://ocean-52xt.onrender.com/publier/${req.file.originalname}`;


  // Créez la publicité avec l'URL complète de l'image
  Publiers.create({ imagepublier: imageUrl })
    .then((publicite) => {
      console.log("Publicité Créée :", publicite);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(publicite);
    })
    .catch((err) => next(err));
});

publiers.route('/publicite/:publiciteId')
.get((req, res, next) => {
    Publiers.findById(req.params.publiciteId)
    .then((publicite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(publicite);
    })
    .catch((err) => next(err));
})
.put((req, res, next) => {
    Publiers.findById(req.params.publiciteId)
    .then((publicite) => {
        if (publicite != null) {
            Publiers.findByIdAndUpdate(req.params.publiciteId, { $set: req.body }, { new: true })
            .then((publicite) => {
                Publiers.findById(publicite._id)
                .then((publicite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(publicite); 
                });               
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Publicite ' + req.params.publiciteId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Publiers.findById(req.params.publiciteId)
    .then((publicite) => {
        if (publicite != null) {
            Publiers.findByIdAndRemove(req.params.publiciteId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Publicite ' + req.params.publiciteId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
});

publiers.use(express.static('public/publicites'));

module.exports = publiers;