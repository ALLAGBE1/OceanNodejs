const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Ratings = require('../models/rating');

const etoileRouter = express.Router();

etoileRouter.use(bodyParser.json());

// etoileRouter.route('/')
// .get((req,res,next) => {
//     console.log("Bonjour oui")
// })


etoileRouter.route('/')
// .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Ratings.find(req.query)
    .populate('author')
    .then((comments) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(comments);
    }, (err) => next(err))
    .catch((err) => next(err));
})
// Poster une étoile
.post(cors.corsWithOptions, (req, res, next) => {
    console.log("posttttttttttttttttttttttttttttttttttttttttttttt")
    if (req.body != null) {
        // req.body.author = req.user._id;
        Ratings.create(req.body)
        .then((comment) => {
            Ratings.findById(comment._id)
            .populate('author')
            .then((comment) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(comment);
            })
        }, (err) => next(err))
        .catch((err) => next(err));
    }
    else {
        err = new Error('Comment not found in request body');
        err.status = 404;
        return next(err);
    }

})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /comments/');
})
.delete((req, res, next) => {
    Ratings.deleteMany({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

etoileRouter.route('/:etoileId')
// .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Ratings.findById(req.params.etoileId)
    .populate('author')
    .then((comment) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(comment);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /comments/'+ req.params.etoileId);
})
// Mettre à jour une étoile
.put((req, res, next) => {
    Ratings.findById(req.params.etoileId)
    .then((publicite) => {
        if (publicite != null) {
            Ratings.findByIdAndUpdate(req.params.etoileId, { $set: req.body }, { new: true })
            .then((publicite) => {
                Ratings.findById(publicite._id)
                .then((publicite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(publicite); 
                });               
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Publicite ' + req.params.etoileId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Ratings.findById(req.params.etoileId)
    .then((comment) => {
        if (comment != null) {
            if (!comment.author.equals(req.user._id)) {
                var err = new Error('You are not authorized to delete this comment!');
                err.status = 403;
                return next(err);
            }
            Ratings.findByIdAndRemove(req.params.etoileId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            err = new Error('Comment ' + req.params.etoileId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

// Récupérer les étoiles données à un prestataire par son author
etoileRouter.route('/ratings/:ratingId')
.get((req, res, next) => {
    const { author } = req.query;
    Ratings.find({ prestataire: req.params.ratingId, author})
    .populate('author')
    .then((produits) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(produits);
    })
    .catch((err) => next(err));
});

etoileRouter.route('/ratings/users/:ratingId')
.get((req, res, next) => {
 console.log("getttttttttttttttttttttttttttttttttttttttt");
 Ratings.find({ prestataire: req.params.ratingId })
 .populate('author')
 .populate('prestataire')
 .then((produits) => {
    console.log("555555555555555555555555555555555555");
     if (produits.length === 0) {
         const error = new Error('Aucun produit trouvé.');
         error.status = 404;
         throw error;
     }
    
    console.log("6666666666666666666666666666666666666666");
    
     let ratings = produits.map(product => Number(product.rating));
     let sum = ratings.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
     let average = sum / ratings.length;
     let prestataire = produits[0].prestataire; // Get the prestataire from the first product

     res.status(200).json({ average: average, prestataire: prestataire });
 })
 .catch((err) => next(err)); // Assurez-vous que cette ligne est la dernière dans la chaîne de promesses
});


etoileRouter.route('/ratings/superieur/egale/quatre')
.get((req,res,next) => {
    const { lat, lng, distanceMax } = req.query;

    const maxDistanceMeters = parseInt(distanceMax) || 5000;
  Ratings.aggregate([
      {
          $group: {
              _id: "$prestataire",
              averageRating: { $avg: { $toInt: "$rating" } },
              count: { $sum: 1 }
          }
      },
      {
          $lookup: {
              from: "users", // nom de la collection du prestataire
              localField: "_id",
              foreignField: "_id",
              as: "prestataire_info"
          }
      },
      { $unwind: "$prestataire_info" },
      {
          $match: {
              averageRating: { $gte: 4 }
          }
      },
      {
          $sort: {
              averageRating: -1
          }
      }
  ])
  .then((ratings) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(ratings);
  }, (err) => next(err))
  .catch((err) => next(err));
})


module.exports = etoileRouter;
