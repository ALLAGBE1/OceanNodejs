var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');

function generateRandomCode() {
  return crypto.randomBytes(3).toString('hex'); 
}

function generateRandomCode1() {
  const timestamp = Date.now().toString(); // Utilisez la date actuelle en millisecondes comme composant d'incrémentation
  const randomCode = crypto.randomBytes(3).toString('hex');
  return timestamp + '_' + randomCode;
}



var router = express.Router();
router.use(bodyParser.json());

// :::::::::::::::::::::::
// Configuration de multer pour le stockage des fichiers

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Définit le répertoire de stockage
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Définit le nom du fichier
  }
});

const imageFileFilter = (req, file, cb) => {
  if(!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Vous ne pouvez télécharger que des fichiers pdf !'), false);
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

// ::::::::::::::::::::::
let nameimage = "";

const storage1 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/users'); // Définit le répertoire de stockage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      //   cb(null, file.originalname + '-' + uniqueSuffix); // Ajoute un timestamp au nom du fichier
    nameimage = uniqueSuffix + '-' +  file.originalname;
    cb(null, nameimage); // Définit le nom du fichier
  }
});

const imageFileFilter1 = (req, file, cb) => {
  if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Vous ne pouvez télécharger que des fichiers pdf !'), false);
  }
  cb(null, true);
};

const upload1 = multer({ storage: storage1, fileFilter: imageFileFilter1 });

//////////////////////////////////////

/* GET users listing. */
router.get('/', (req, res, next) => {
  User.find({})

    .then((publicites) => {
      const transformedPublicites = publicites.map(publicite => {
        publicite = publicite.toObject();

        let imageName = publicite.imageProfil;
        publicite.afficheUrl = `${imageName}`;
        return publicite;
      })

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(transformedPublicites); // Utilisez les données transformées
    })
    .catch((err) => next(err));
});

router.get('/images/:imageName', (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'public/users', imageName);

  // Vérifiez que le fichier image existe
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});


router.get('/partenaires', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({documentfournirId: {$ne: ''}})  // Cette requête trouve tous les utilisateurs où documentfournirId n'est pas une chaîne vide.
    .then((users) => {
      // Transformez chaque utilisateur pour ajouter une URL de téléchargement
      const transformedUsers = users.map(user => {
        user = user.toObject();  // Convertit le document Mongoose en objet JavaScript simple
        // user.downloadUrl = `/download/${user.documentfournirId}`;  // Ajoutez l'URL de téléchargement basée sur l'ID du document
        
        // Récupérez uniquement le nom du fichier à partir de documentfournirId
        let fileName = path.basename(user.documentfournirId);
        
        // Utilisez ce nom de fichier pour créer l'URL de téléchargement
        user.downloadUrl = `/download/${fileName}`;

        return user;
      });
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(transformedUsers);
    })
    .catch((err) => next(err));
});

// Seache Location 
router.get('/locations', (req, res, next) => {
  User.find({location: {$ne: null}})  // Cette requête trouve tous les utilisateurs où documentfournirId n'est pas une chaîne vide.
    .then((position) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(position);
    })
    .catch((err) => next(err));
});

// Route de téléchargement
router.get('/download/:filename', (req, res) => {
  console.log(req.params.filename);
  const file = path.join(__dirname, '../public/images', req.params.filename);
  if (fs.existsSync(file)) {
    res.download(file);
  } else {
    res.status(404).send("Fichier non trouvé");
  }
});

// http://192.168.0.14:3000/users/download/nom_du_fichier.pdf

router.get('/partenaires/:partenaireId', (req, res, next) => {
  User.findById(req.params.partenaireId) 
    .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(user);
    })
    .catch((err) => next(err));
});

router.put('/partenaires/:partenaireId', (req, res, next) => {
  User.findById(req.params.partenaireId) 
    .then((user) => {
      if(user != null) {
        User.findByIdAndUpdate(req.params.partenaireId, { $set: req.body }, { neww: true })
        .then((user) => {
          User.findById(user._id)
          .then((user) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user); 
          });
        })
        .catch((err) => next(err));
      }
      else {
        err = new Error('Partenaire ' + req.params.partenaireId + ' introuvable');
        err.status = 404;
        return next(err);            
    }
    })
    .catch((err) => next(err));
});

// ::::::: Gestion de l'envoie du mail
async function sendConfirmationEmail(userEmail, userName, verificationCode) {

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'emailjosue256@gmail.com', // votre email
      pass: 'usrgwuokswffsrek', // votre mot de passe
    },
  });

  let mailOptions = {
    from: 'emailjosue256@gmail.com',
    to: userEmail,
    subject: 'Confirmation d\'inscription',
    text: `Bonjour ${userName}, bienvenue sur Océan. Votre code de vérification est : ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email envoyé : ' + info.response);
    }
  });
}


// Fonction, utilisant la formule de la haversine pour calculer la distance entre 
// les coordonnées spécifiées (lat, lng) et les coordonnées de chaque prestataire récupéré.
function calculateDistance(lat1, lng1, lat2, lng2) {
  const earthRadius = 6378100; // Rayon de la Terre en mètres
  const radiansLat1 = (lat1 * Math.PI) / 180;
  const radiansLng1 = (lng1 * Math.PI) / 180;
  const radiansLat2 = (lat2 * Math.PI) / 180;
  const radiansLng2 = (lng2 * Math.PI) / 180;

  const dLat = radiansLat2 - radiansLat1;
  const dLng = radiansLng2 - radiansLng1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radiansLat1) * Math.cos(radiansLat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c;
  return distance;
}

router.get('/prestataires', (req, res, next) => {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    })
    .catch((err) => next(err));
});

router.get('/prestataire/:userId', (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(user);
    })
    .catch((err) => next(err));
});


// Route pour mettre à jour un prestataire ou (mise à jour de ces coordonnées géographiques)
router.put('/prestataires/:prestataireId', (req, res, next) => {
  User.findById(req.params.prestataireId) 
    .then((user) => {
      if(user != null) {
        User.findByIdAndUpdate(req.params.prestataireId, { $set: req.body }, { new: true })
        .then((user) => {
          User.findById(user._id)
          .then((user) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            // console.log(user);
            res.json(user); 
          });
        })
        .catch((err) => next(err));
      }
      else {
        err = new Error('Prestataires ' + req.params.prestataireId + ' introuvable');
        err.status = 404;
        return next(err);            
    }
    })
    .catch((err) => next(err));
});

// Route pour récupérer les prestataires par type, emplacement géospatial et 
// la distance maximale de recherche en fonction du besoins clients
router.get('/prestataires/:type', async (req, res, next) => {
  const { type } = req.params;
  const { lat, lng, distanceMax } = req.query;

  if (!['Électricien', 'Garagiste', 'Plombier', 'Mécanicien', 'Menuiserie', 'Jardinage', 'Réparation électronique', 'Entretien de piscines', 'Déménagement', 'Informatique', 'Serrurerie', 'Froid et Climatisation', 'Carrelage', 'Téléphone et ordinateur', 'Free-lance', 'Livreur', 'Autres'].includes(type)) {
    // Gérer le cas où le type n'est pas valide
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: 'Type invalide' });
  }

  // Utilisation de 500 mètres par défaut si `distanceMax` n'est pas fourni ou n'est pas un nombre valide.
  // const maxDistanceMeters = parseInt(distanceMax) || 5000;
  const maxDistanceMeters = parseInt(distanceMax) || 5000;

  try {
    // Recherche géospatiale des prestataires du type spécifié
    const users = await User.find({
      domaineactivite: type,
      prestataire: true,
      disponible: true,
      location: { $ne: null },
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], maxDistanceMeters / 6378100] }
      }
    });
  
    // Supposons que la vitesse moyenne est de 50 mètres par minute
    const averageSpeedMetersPerMinute = 50;
  
    // Calculer la durée en minutes pour chaque utilisateur trouvé
    const usersWithDistanceAndDuration = users.map((user) => {
      const userLat = user.location.coordinates[1]; // Latitude de l'utilisateur
      const userLng = user.location.coordinates[0]; // Longitude de l'utilisateur
      const userDistance = calculateDistance(lat, lng, userLat, userLng);
      const roundedDistance = Math.round(userDistance); // Distance arrondie en mètres
      const durationMinutes = Math.round(roundedDistance / averageSpeedMetersPerMinute); // Durée en minutes
      return { ...user._doc, distance: roundedDistance, duration: durationMinutes };
    });
    // console.log(usersWithDistanceAndDuration);
  
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(usersWithDistanceAndDuration);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: false, message: err.message });
  }
});


// Route pour chercher les prestataires par nom de prestataire, emplacement géospatial et 
// la distance maximale de recherche en fonction du besoins clients
router.get('/prestatairesNom/:searchTerm', async (req, res, next) => {
  const { searchTerm } = req.params;
 

  try {
    // Recherche géospatiale des prestataires du type spécifié
    const users = await User.find({
      username: searchTerm,
      prestataire: true,
      disponible: true,
      
    });
   
  
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
    // res.json(usersWithDistanceAndDuration);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: false, message: err.message });
  }
});


// jOSUé
router.get('/prestatairesparchoix/', async (req, res, next) => {
  try {
    // Recherche géospatiale des prestataires du type spécifié
    const users = await User.find({
      domaineactivite: 'Garagiste',
      prestataire: true,
      disponible: true,
      location: { $ne: null },
      // location: {
      //   $geoWithin: { $centerSphere: [[lng, lat], maxDistanceMeters / 6378100] }
      // }
    });
  
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: false, message: err.message });
  }
});


router.post('/sinscrire', upload.single('documentfournirId'), async (req, res, next) => {
  let errorResponse = null;

  try {
    // Vérifier si le username existe déjà
    const existingUsername = await User.findOne({ username: req.body.username });
    if (existingUsername) {
      // Le username existe déjà
      errorResponse = { success: false, status: 'Ce nom d\'utilisateur existe déjà. Veuillez choisir un autre nom d\'utilisateur.' };
    }

    // Vérifier si l'e-mail existe déjà
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      // L'utilisateur avec cet e-mail existe déjà
      errorResponse = { success: false, status: 'Cet e-mail existe déjà. Veuillez utiliser un autre e-mail.' };
    }

    if (!errorResponse) {
      // Si le numero, le username et l'e-mail n'existent pas, procéder à l'enregistrement
      const user = await User.register(new User({ username: req.body.username }), req.body.password);

      if (req.body.nomprenom) user.nomprenom = req.body.nomprenom;
      if (req.body.numero) user.numero = req.body.numero;
      if (req.body.email) user.email = req.body.email;
      if (req.body.nomcommercial) user.nomcommercial = req.body.nomcommercial;
      if (req.body.domaineactivite) user.domaineactivite = req.body.domaineactivite;

      if (req.file) {
        user.documentfournirId = req.file.path;
      }

      if (req.body.location) {
        user.location = JSON.parse(req.body.location);
      }

      await user.save();

      passport.authenticate('local')(req, res, () => {
        res.status(200).json({ success: true, status: 'Inscription réussie !' });
      });
    }
  } catch (err) {
    console.error(err);
    errorResponse = { success: false, status: 'Une erreur s\'est produite lors de l\'enregistrement.', err: err.message };
  }

  if (errorResponse) {
    res.status(400).json(errorResponse);
  }
});


router.post('/connexion', /*cors.corsWithOptions,*/ async (req, res, next) => {
  const verificationCode = generateRandomCode();

  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Envoyer une réponse d'échec si l'utilisateur n'est pas trouvé
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      const response = {
        success: false,
        status: 'Connexion échouée !',
        err: info.message,
        // err: info,
      };
      console.log(response);
      res.json(response);
      return;
    }

    try {
      // const confirmation = await user.updateOne({ verificationCode: verificationCode }); 
      // const user = await User.findOne({ username: username });
      if(user.confirmation == false) {
        await user.updateOne({ verificationCode: verificationCode }); // Mettez à jour le champ verificationCode
        // Envoyer l'email de confirmation
        sendConfirmationEmail(user.email, user.username, verificationCode);
      }

      var token = authenticate.getToken({ _id: user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      const response = {
        success: true,
        status: 'Connexion réussie !',
        token: token,
        user: user,
      };
      console.log(response);
      res.json(response);
      return;
    } catch (error) {
      // Gérer les erreurs ici, si la mise à jour échoue
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      const response = {
        success: false,
        status: 'Erreur lors de la mise à jour du code de vérification !',
        err: error.message,
      };
      console.error(response);
      res.json(response);
      return;
    }
  })(req, res, next);
});


router.post('/verification', async (req, res, next) => {
  const { username, verificationCode } = req.body;
  console.log("aaaaaaaaaaaaaaaaaaaaaaa");
  try {
    // Recherchez l'utilisateur par son adresse e-mail
    const user = await User.findOne({ username: username });

    console.log("bbbbbbbbbbbbbbbbbbbbbbb");
    if (!user) {
      console.log("xxxxxxxxxxxxxxxxxxxxxxxx");
      // Si l'utilisateur n'est pas trouvé, renvoyez une réponse d'échec
      res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
      console.log("zzzzzzzzzzzzzzzzzzzzzzzz");
      return;
    }

    console.log("ccccccccccccccccccccccccc");
    if (user.verificationCode === verificationCode && !user.confirmation) {
      console.log("ddddddddddddddddddddddddd");
      // Si le code de vérification correspond et que l'utilisateur n'a pas encore été confirmé
      user.confirmation = true;
      await user.save();

  
      res.status(200).json({ success: true, message: "Validation du compte confirmée avec succès."});
    } else {
      // Si le code de vérification ne correspond pas ou que l'utilisateur est déjà confirmé
      res.status(400).json({ success: false, message: "Code de vérification invalide ou utilisateur déjà confirmé." });
    }
  } catch (error) {
    // Gérez les erreurs ici
    console.error(error);
    res.status(500).json({ success: false, message: "Une erreur s'est produite lors de la vérification de l'inscription." });
  }
});

router.put('/update/:userId', (req, res, next) => {


  User.findById(req.params.userId)
  .then((publicite) => {
      if (publicite != null) {
          User.findByIdAndUpdate(req.params.userId, { $set: req.body }, { new: true })
          .then((publicite) => {
              User.findById(publicite._id)
              .then((publicite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(publicite); 
              });               
          })
          .catch((err) => next(err));
      }
      else {
          err = new Error('Publicite ' + req.params.userId + ' introuvable');
          err.status = 404;
          console.log('Error:', err.message);
          return next(err);            
      }
  })
  .catch((err) => next(err));
});


router.put('/updateImageProfile/:userId', upload1.single('photoProfil'), async (req, res, next) => {
  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  try {
    // const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.originalname}`;
    const imageUrl = `https://ocean-52xt.onrender.com/users/${nameimage}`;

    const user = await User.findById(req.params.userId);

    if (user != null) {
      // Assurez-vous que le fichier existe avant de l'utiliser
      if (req.file && req.file.path) {
        user.photoProfil = imageUrl;

        const updatedUser = await user.save();

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(updatedUser);
      } else {
        const err = new Error('Fichier image introuvable');
        err.status = 404;
        console.error('Error:', err.message);
        return next(err);
      }
    } else {
      const err = new Error('Utilisateur ' + req.params.userId + ' introuvable');
      err.status = 404;
      console.error('Error:', err.message);
      return next(err);
    }
  } catch (err) {
    console.error('Error:', err);
    next(err);
  }
});


// router.put('/updateImageProfile/:userId', upload1.single('photoProfil'), async (req, res, next) => {
//   try {
//     const imageUrl = `https://ocean-52xt.onrender.com/users/${req.file.originalname}`;

//     const user = await User.findById(req.params.userId);

//     if (user != null) {
//       user.photoProfil = imageUrl;

//       const updatedUser = await user.save();
      
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(updatedUser);
//     } else {
//       const err = new Error('Utilisateur ' + req.params.userId + ' introuvable');
//       err.status = 404;
//       console.error('Error:', err.message);
//       return next(err);
//     }
//   } catch (err) {
//     console.error('Error:', err);
//     next(err);
//   }
// });

// router.put('/updateImageProfile/:userId', upload1.single('photoProfil'), (req, res, next) => {
//   const imageUrl = `https://ocean-52xt.onrender.com/users/${req.file.originalname}`;

//   User.findById(req.params.userId)
//     .then((user) => {
//       if (user != null) {
//         user.photoProfil = imageUrl;

//         user.save()
//           .then((updatedUser) => {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(updatedUser);
//           })
//           .catch((err) => {
//             console.error('Error saving user:', err);
//             next(err);
//           });
//       } else {
//         const err = new Error('Utilisateur ' + req.params.userId + ' introuvable');
//         err.status = 404;
//         console.error('Error:', err.message);
//         return next(err);
//       }
//     })
//     .catch((err) => {
//       console.error('Error finding user:', err);
//       next(err);
//     });
// });


async function sendResetPasswordEmail(userEmail, userName, verificationCode) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'emailjosue256@gmail.com', 
      pass: 'usrgwuokswffsrek', 
    },
  });

  let mailOptions = {
    from: 'emailjosue256@gmail.com',
    to: userEmail,
    subject: 'Réinitialisation du mot de passe',
    text: `Bonjour ${userName}, vous avez demandé la réinitialisation de votre mot de passe. Votre code de vérification est : ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email de réinitialisation envoyé : ' + info.response);
    }
  });
}


router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = req.body.email;

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('L\'adresse e-mail n\'existe pas.');
    }

    const verificationCode = generateRandomCode1();
    // codeVerify
    // await user.setPassword(verificationCode);
    await user.updateOne({ codeVerify: verificationCode });

    await sendResetPasswordEmail(user.email, user.name, verificationCode);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, status: 'Email de réinitialisation envoyé.' });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: false, status: 'Une erreur s\'est produite.' });
  }
});



router.post('/update/password', async (req, res, next) => {
  try {
    const { codeVerify, newpassword } = req.body;

    // Trouver l'utilisateur par codeVerify
    const user = await User.findOne({ codeVerify });

    // Vérifier si l'utilisateur existe
    if (!user) {
      const err = new Error('Code de vérification incorrect. Veuillez insérer le bon.');
      err.status = 404;
      console.error('Error:', err.message);
      return next(err);
    }

    // Mettre à jour le mot de passe de l'utilisateur
    user.setPassword(newpassword, async (err) => {
      if (err) {
        return next(err);
      }

      // Enregistrer l'utilisateur mis à jour
      await user.save();

      res.status(200).json(user);
    });
  } catch (err) {
    next(err);
  }
});


router.put('/update/password/:userId', async (req, res, next) => {
  const { newpassword } = req.body;
  console.log("password", newpassword);
  try {
    const user = await User.findById(req.params.userId);
    
    if (user != null) {
      user.setPassword(newpassword, async function(err) {
        if (err) {
          return next(err);
        }
        await user.save();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
      });
    } else {
      const err = new Error('User ' + req.params.userId + ' introuvable');
      err.status = 404;
      console.log('Error:', err.message);
      return next(err);
    }
  } catch (err) {
    next(err);
  }
});


router.get('/logout', /*cors.cors,*/ (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
    console.log("T'es logout");
  } else {
    var err = new Error("Vous n'êtes pas connecté !");
    err.status = 403;
    next(err);
  }
});

router.get(
  '/facebook/token',
  passport.authenticate('facebook-token'),
  (req, res) => {
    if (req.user) {
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        token: token,
        status: 'Vous êtes connecté avec succès !',
      });
    }
  }
);

router.get('/checkJWTtoken', (req, res) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT invalide !', success: false, err: info });
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT valide !', success: true, user: user });
    }
  })(req, res);
});


module.exports = router;