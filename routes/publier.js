var express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Publiers = require('../models/publier');

const publiers = express.Router();
publiers.use(bodyParser.json());

const storage = multer.memoryStorage(); // Store images as buffers in memory
const upload = multer({ storage: storage });

// :::::::::::::::::::::::
// Configuration de multer pour le stockage des fichiers
// let nameimage = "";

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/publicites'); // Définit le répertoire de stockage
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       //   cb(null, file.originalname + '-' + uniqueSuffix); // Ajoute un timestamp au nom du fichier
//       nameimage = uniqueSuffix + '-' +  file.originalname;
//       cb(null, nameimage); // Définit le nom du fichier
//     }
//   });
  
//   const imageFileFilter2 = (req, file, cb) => {
//     if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//         return cb(new Error('Vous ne pouvez télécharger que des fichiers jpeg, png, gif !'), false);
//     }
//     cb(null, true);
//   };
  
// const upload = multer({ storage: storage, fileFilter: imageFileFilter2 })
// ::::::::::::::::::::::::::::::::::::::::::::::::

publiers.route('/')
    .get((req, res, next) => {
      Publiers.find(req.query)
            .then((fournisseurs) => {
                const transformedFournisseurs = fournisseurs.map(fournisseur => {
                    fournisseur = fournisseur.toObject();

                    // Inclure les données binaires du logo de l'entreprise et de la pièce d'identité dans la réponse JSON
                    fournisseur.logoEntrepriseData = {
                        data: fournisseur.imagepublier.toString('base64'),
                        // type: 'image/jpeg' // Remplacez par le type approprié
                        type: fournisseur.imageType
                    };

                    // fournisseur.pieceIdentiteData = {
                    //     data: fournisseur.pieceIdentite.toString('base64'),
                    //     type: 'application/pdf' // Remplacez par le type approprié
                    // };

                    return fournisseur;
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(transformedFournisseurs);
            })
            .catch((err) => next(err));
    });


// publiers.route('/')
//   .get((req, res, next) => {
//     Publiers.find(req.query)
//       .then((publicites) => {
//         const transformedPublicites = publicites.map(publicite => {
//           publicite = publicite.toObject();

//           let imageName = publicite.imagepublier;
//           publicite.afficheUrl = `${imageName}`;
//           return publicite;
//         })

//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(transformedPublicites); // Utilisez les données transformées
//       })
//       .catch((err) => next(err));
//   });

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


publiers.route('/')
  .post(upload.single('imagepublier'), async (req, res, next) => {
    try {
      // const { titre, description, apercu } = req.body;
      const imageBuffer = req.file.buffer;

      const blog = await Publiers.create({
        // titre: titre,
        // description: description,
        imagepublier: imageBuffer, // Store image as buffer directly in the document
        // apercu: apercu
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(blog);
    } catch (err) {
      console.error("Erreur lors de la création du blog :", err);
      res.status(500).json({ error: err.message || "Une erreur est survenue lors de la création du blog." });
    }
  });


// Route pour la création d'images
// publiers.route('/')
// .post(upload.single('imagepublier'), (req, res, next) => {
//   // Le fichier sera stocké dans req.file grâce à multer

//   // Construisez l'URL complète de l'image créée
//   // const imageUrl = `${req.protocol}://${req.get('host')}/publier/${req.file.originalname}`;
//   const imageUrl = `https://ocean-52xt.onrender.com/publier/${nameimage}`;


//   // Créez la publicité avec l'URL complète de l'image
//   Publiers.create({ imagepublier: imageUrl })
//     .then((publicite) => {
//       console.log("Publicité Créée :", publicite);
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(publicite);
//     })
//     .catch((err) => next(err));
// });

publiers.route('/publicite/:publiciteId')
.get((req, res, next) => {
  Publiers.findById(req.params.publiciteId)
      .then((blog) => {
          if (!blog) {
              res.status(404).json({ message: "Blog not found" });
              return;
          }

          const responseData = {
              // _id: blog._id,
              // titre: blog.titre,
              // description: blog.description,
              // Inclure le type et les données binaires de l'image dans la réponse JSON
              imagepublier: {
                  type: blog.imageType, // Assurez-vous de définir blog.imageType correctement
                  data: blog.image.toString('base64'),
              },
          };

          res.status(200).json(responseData);
      })
      .catch((err) => next(err));
})
// .get((req, res, next) => {
//     Publiers.findById(req.params.publiciteId)
//     .then((publicite) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(publicite);
//     })
//     .catch((err) => next(err));
// })
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