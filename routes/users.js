var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


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

/* GET users listing. */
router.get('/', (req, res, next) => {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    })
    .catch((err) => next(err));
});

router.get('/partenaires', (req, res, next) => {
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

// 
// router.get('/prestataires/soudeur', (req, res, next) => {
//   User.find({domaineactivite: 'Soudeur', prestataire: true })
//     .then((prestataires) => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(prestataires);
//     })
//     .catch((err) => next(err));
// });

// router.get('/prestataires/:type', (req, res, next) => {
//   const type = req.params.type; // Récupérer le type de prestataire à partir du paramètre

//   User.find({ domaineactivite: type = ('Soudeur' || 'Plombier'), prestataire: true })
//     .then((prestataires) => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(prestataires);
//     })
//     .catch((err) => next(err));
// });

router.get('/prestataires/:type', (req, res, next) => {
  const type = req.params.type; // Récupérer le type de prestataire à partir du paramètre

  if (type === 'Électricien' || type === 'Garagiste' || type === 'Plombier' || type === 'Mécanicien') {
    User.find({ domaineactivite: type, prestataire: true })
      .then((prestataires) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(prestataires);
      })
      .catch((err) => next(err));
  } else {
    // Gérer le cas où le type n'est ni "Soudeur" ni "Plombier"
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.json({ message: "Type invalide" });
  }
});



// app.use(express.static(path.join(__dirname, 'public')));


// router.get('/partenaires', (req, res, next) => {
//   User.find({ documentfournirId: { $ne: '' } }) // $ne signifie "not equal", donc on cherche tous les documents où documentfournirId n'est pas égal à ''
//     .then((users) => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(users);
//     })
//     .catch((err) => next(err));
// });


router.post('/sinscrire', upload.single('documentfournirId'), (req, res, next) => {
  // Le fichier sera stocké dans req.file grâce à multer

  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: err });
        return;
      }
      if (req.body.nomprenom) user.nomprenom = req.body.nomprenom;
      if (req.body.email) user.email = req.body.email;
      if (req.body.nomcommercial) user.nomcommercial = req.body.nomcommercial;
      if (req.body.domaineactivite) user.domaineactivite = req.body.domaineactivite;

      // Si un fichier est téléchargé, sauvegardez le chemin dans la base de données
      if (req.file) {
        user.documentfournirId = req.file.path;
      }

      user
        .save()
        .then((user) => {
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, status: 'Inscription réussie !' });
          });
        })
        .catch((err) => {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.json({
            success: false,
            status: 'Nom d\'utilisateur ou mot de passe incorrect !',
          });
        });
    }
  );
});

// router.post('/sinscrire', (req, res, next) => {
//   User.register(
//     new User({ username: req.body.username }),
//     req.body.password,
//     (err, user) => {
//       if (err) {
//         res.statusCode = 500;
//         res.setHeader('Content-Type', 'application/json');
//         res.json({ err: err });
//         return;
//       } 
//       if (req.body.nomprenom) user.nomprenom = req.body.nomprenom;
//       if (req.body.email) user.email = req.body.email;
//       if (req.body.nomcommercial) user.nomcommercial = req.body.nomcommercial;
//       if (req.body.domaineactivite) user.domaineactivite = req.body.domaineactivite;
//       // if (req.body.documentfournirId) user.documentfournirId = req.body.documentfournirId;
//       user
//         .save()
//         .then((user) => {
//           passport.authenticate('local')(req, res, () => {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json({ success: true, status: 'Inscription réussie !' });
//           });
//         })
//         .catch((err) => {
//           res.statusCode = 401;
//           res.setHeader('Content-Type', 'application/json');
//           res.json({
//             success: false,
//             status: 'Nom d\'utilisateur ou mot de passe incorrect !',
//           });
//         });
//     }
//   );
// });

router.post('/connexion', /*cors.corsWithOptions,*/ (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      const response = {
        success: false,
        status: 'Connexion échouée !',
        err: info,
      }
      console.log(response);
      res.json(response);
      return;
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({
          success: false,
          status: 'Connexion échouée !',
          err: "Impossible de connecter l'utilisateur !",
        });
        console.log(res.json({
          success: false,
          status: 'Connexion échouée !',
          err: "Impossible de connecter l'utilisateur !",
        }));
        return;
      }

      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      result = res.json({
        success: true,
        status: 'Connexion réussie !',
        token: token,
        user: user,
      });
      // console.log(result);
      console.log("Super************************");
    });
  })(req, res, next);
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


// router.get('/partenaires/:partenaireId', (req, res, next) => {
//   User.findById(req.params.partenaireId) 
//     .then((user) => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(user);
//     })
//     .catch((err) => next(err));
// });

// router.put('/partenaires/:partenaireId', (req, res, next) => {
//   User.findById(req.params.partenaireId) 
//     .then((user) => {
//       if(user != null) {
//         User.findByIdAndUpdate(req.params.partenaireId, { $set: req.body }, { neww: true })
//         .then((user) => {
//           User.findById(user._id)
//           .then((user) => {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(user); 
//           });
//         })
//         .catch((err) => next(err));
//       }
//       else {
//         err = new Error('Partenaire ' + req.params.partenaireId + ' introuvable');
//         err.status = 404;
//         return next(err);            
//     }
//     })
//     .catch((err) => next(err));
// });



module.exports = router;

