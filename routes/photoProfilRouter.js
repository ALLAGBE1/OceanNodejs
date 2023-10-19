var express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PhotoProfils = require('../models/photoProfil');

const photoProfils = express.Router();
photoProfils.use(bodyParser.json());

// :::::::::::::::::::::::
// Configuration de multer pour le stockage des fichiers

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/photoProfils'); // Définit le répertoire de stockage
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

photoProfils.route('/')
  .get((req, res, next) => {
    PhotoProfils.find(req.query)
      .then((publicites) => {
        const transformedPublicites = publicites.map(publicite => {
          publicite = publicite.toObject();

          let imageName = publicite.photoProfil;
          publicite.afficheUrl = `${imageName}`;
          return publicite;
        })

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(transformedPublicites); // Utilisez les données transformées
      })
      .catch((err) => next(err));
  });

photoProfils.get('/images/:imageName', (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'public/photoProfils', imageName);

  // Vérifiez que le fichier image existe
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
})


// Route pour la création d'images
photoProfils.route('/')
.post(upload.single('photoProfil'), (req, res, next) => {
  // Le fichier sera stocké dans req.file grâce à multer

  // Construisez l'URL complète de l'image créée
  const imageUrl = `${req.protocol}://${req.get('host')}/photoProfils/${req.file.originalname}`;

  // Créez la publicité avec l'URL complète de l'image
  PhotoProfils.create({ photoProfil: imageUrl, userId: req.body.userId })
    .then((publicite) => {
      console.log("Publicité Créée :", publicite);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(publicite);
    })
    // .catch((err) => next(err));
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la création de la publicité' });
    });
});

photoProfils.route('/profil/:profilId')
.get((req, res, next) => {
    PhotoProfils.findById(req.params.profilId)
    .then((publicite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(publicite);
    })
    .catch((err) => next(err));
})
.put((req, res, next) => {
    PhotoProfils.findById(req.params.profilId)
    .then((publicite) => {
        if (publicite != null) {
            PhotoProfils.findByIdAndUpdate(req.params.profilId, { $set: req.body }, { new: true })
            .then((publicite) => {
                PhotoProfils.findById(publicite._id)
                .then((publicite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(publicite); 
                });               
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Publicite ' + req.params.profilId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    PhotoProfils.findById(req.params.profilId)
    .then((publicite) => {
        if (publicite != null) {
            PhotoProfils.findByIdAndRemove(req.params.profilId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Publicite ' + req.params.profilId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
});


photoProfils.route('/profilUser/:profilUserId')
.get((req, res, next) => {
    PhotoProfils.find({ userId: req.params.profilUserId })
    .populate('userId')
    .then((produits) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(produits);
    })
    .catch((err) => next(err));
});

photoProfils.use(express.static('public/photoProfils'));

module.exports = photoProfils;