var express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Publiers = require('../models/publier');

const publiers = express.Router();
publiers.use(bodyParser.json());

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/publicites'); // Définit le répertoire de stockage
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Définit le nom du fichier
  }
});

const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Vous ne pouvez télécharger que des fichiers jpeg, png, gif !'), false);
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

// Endpoint pour obtenir toutes les publicités
publiers.route('/')
  .get((req, res, next) => {
    Publiers.find(req.query)
      .then((publicites) => {
        const transformedPublicites = publicites.map(publicite => {
          publicite = publicite.toObject();

          let imageName = publicite.imagepublier;
          publicite.afficheUrl = `/images/${imageName}`;
          return publicite;
        })

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(transformedPublicites); // Utilisez les données transformées
      })
      .catch((err) => next(err));
  });

// Gestionnaire de route pour afficher les images
// publiers.get('/images/:imageName', (req, res, next) => {
//   const imageName = req.params.imageName;
//   const imagePath = path.join(__dirname, 'public/publicites', imageName);

//   // Vérifiez que le fichier image existe
//   if (fs.existsSync(imagePath)) {
//     res.sendFile(imagePath); // Renvoie directement le fichier image
//   } else {
//     res.status(404).send('Image not found');
//   }
// });

publiers.get('/images/:imageName', (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'public/publicites', imageName);

  // Vérifiez que le fichier image existe
  if (fs.existsSync(imagePath)) {
    const imageUrl = `http://192.168.43.166:3000/public/publicites/${imageName}`;
    res.json({ imageUrl });
  } else {
    res.status(404).send('Image not found');
  }
})

// Route pour la création d'images
publiers.post('/images', upload.single('imagepublier'), (req, res, next) => {
  // Le fichier sera stocké dans req.file grâce à multer

  // Construisez l'URL complète de l'image créée
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.originalname}`;

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

module.exports = publiers;


// :::::::::::::::::

// var express = require('express');
// const bodyParser = require('body-parser');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const Publiers = require('../models/publier');

// const publiers = express.Router();
// publiers.use(bodyParser.json());

// // :::::::::::::::::::::::
// // Configuration de multer pour le stockage des fichiers

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/publicites'); // Définit le répertoire de stockage
//     },
//     filename: (req, file, cb) => {
//       cb(null, file.originalname); // Définit le nom du fichier
//     }
//   });
  
// const imageFileFilter = (req, file, cb) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//     return cb(new Error('Vous ne pouvez télécharger que des fichiers jpeg, png, gif !'), false);
//   }
//   cb(null, true);
// };
  
// const upload = multer({ storage: storage, fileFilter: imageFileFilter });

// publiers.route('/')
// .get((req, res, next) => {
//   Publiers.find(req.query)
//   .then((publicites) => {
//       const transformedPublicites = publicites.map(publicite => {
//         publicite = publicite.toObject();

//         let imageName = publicite.imagepublier;
//         publicite.afficheUrl = `/images/${imageName}`;
//         return publicite;
//       })

//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(publicites);
//   })
//   .catch((err) => next(err));
// })

// .get('/images/:imageName', (req, res, next) => {
//   const imageName = req.params.imageName;
//   const imagePath = path.join(__dirname, 'public/publicites', imageName);

//   // Vérifiez que le fichier image existe
//   if (fs.existsSync(imagePath)) {
//     const imageUrl = `http://192.168.43.166:3000/public/publicites/${imageName}`;
//     res.json({ imageUrl });
//   } else {
//     res.status(404).send('Image not found');
//   }
// })

// // Route pour la création d'images
// .post(upload.single('imagepublier'), (req, res, next) => {
//   // Le fichier sera stocké dans req.file grâce à multer

//   // Construisez l'URL complète de l'image créée
//   // const imageUrl = `${req.protocol}://${req.get('host')}/public/publicites/${req.file.originalname}`;
//   const imageUrl = `${req.protocol}://${req.get('host')}/publier/${req.file.originalname}`;
//   // http://192.168.43.166:3000/publier/shawarma-lebanon.jpg

//   // Créez la publicité avec l'URL complète de l'image
//   Publiers.create({ imagepublier: imageUrl })
//     .then((publicite) => {
//       console.log("Publicité Créée :", publicite);
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(publicite);
//     })
//     .catch((err) => next(err));
// })

// module.exports = publiers;


// ::::::::::::::

// Endpoint pour obtenir toutes les publicités
// .get((req, res, next) => {
//   Publiers.find(req.query)
//   .then((publicites) => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(publicites);
//   })
//   .catch((err) => next(err));
// })



// ::::::::::::::::::::::

// var express = require('express');
// const bodyParser = require('body-parser');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const Publiers = require('../models/publier');

// const publiers = express.Router();
// publiers.use(bodyParser.json());

// // :::::::::::::::::::::::
// // Configuration de multer pour le stockage des fichiers

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/publicites'); // Définit le répertoire de stockage
//     },
//     filename: (req, file, cb) => {
//       cb(null, file.originalname); // Définit le nom du fichier
//     }
//   });
  
//   const imageFileFilter2 = (req, file, cb) => {
//     if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//         return cb(new Error('Vous ne pouvez télécharger que des fichiers jpeg, png, gif !'), false);
//     }
//     cb(null, true);
//   };
  
// const upload = multer({ storage: storage, fileFilter: imageFileFilter2 })

// publiers.route('/')
// .get((req, res, next) => {
//     Publiers.find(req.query)
//     .then((publicites) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(publicites);
//     })
//     .catch((err) => next(err));
// })
// publiers.get('/images/:imageName', (req, res, next) => {
//   const imageName = req.params.imageName;
//   const imagePath = path.join(__dirname, 'public/publicites', imageName);

//   // Vérifiez que le fichier image existe
//   if (fs.existsSync(imagePath)) {
//     res.sendFile(imagePath);
//   } else {
//     res.status(404).send('Image not found');
//   }
// })

// .post(upload.single('imagepublier'), (req, res, next) => {
//   // Le fichier sera stocké dans req.file grâce à multer

//     // Publiers.create({imagepublier : req.file.path})
//     Publiers.create({imagepublier : req.file.originalname})
//     .then((publicite) => {
//         console.log("Publicité Créée :", publicite);
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(publicite);
//     })
//     .catch((err) => next(err));
// });

// publiers.use(express.static('public/publicites'));

// module.exports = publiers;

// .get('/images/:imageName', (req, res, next) => {
//   const imageName = req.params.imageName;
//   const imagePath = path.join(__dirname, 'public/publicites', imageName);

//   // Vérifiez que le fichier image existe
//   if (fs.existsSync(imagePath)) {
//     const imageUrl = `http://192.168.43.166:3000/public/publicites/${imageName}`;
//     res.json({ imageUrl });
//   } else {
//     res.status(404).send('Image not found');
//   }
// })


// ::::::::::::::::::::::


