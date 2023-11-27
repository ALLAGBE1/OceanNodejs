const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Ratings = require('../models/rating');

const ratingRouter = express.Router();

ratingRouter.use(bodyParser.json());

ratingRouter.route('/')
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

ratingRouter.route('/ratings/superieur/egale/quatre')
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

// router.get('/prestatairesNom/:searchTerm', async (req, res, next) => {
//     const { searchTerm } = req.params;
//     const { lat, lng, distanceMax } = req.query;
  
//     // Utilisation de 500 mètres par défaut si `distanceMax` n'est pas fourni ou n'est pas un nombre valide.
//     // const maxDistanceMeters = parseInt(distanceMax) || 5000;
//     const maxDistanceMeters = parseInt(distanceMax) || 5000;
  
//     try {
//       // Recherche géospatiale des prestataires du type spécifié
//       const users = await User.find({
//         username: searchTerm,
//         prestataire: true,
//         disponible: true,
//         location: { $ne: null },
//         location: {
//           $geoWithin: { $centerSphere: [[lng, lat], maxDistanceMeters / 6378100] }
//         }
//       });
//       // console.log(usersWithDistanceAndDuration);
  
//       // Supposons que la vitesse moyenne est de 50 mètres par minute
//       const averageSpeedMetersPerMinute = 50;
    
//       // Calculer la durée en minutes pour chaque utilisateur trouvé
//       const usersWithDistanceAndDuration = users.map((user) => {
//         const userLat = user.location.coordinates[1]; // Latitude de l'utilisateur
//         const userLng = user.location.coordinates[0]; // Longitude de l'utilisateur
//         const userDistance = calculateDistance(lat, lng, userLat, userLng);
//         const roundedDistance = Math.round(userDistance); // Distance arrondie en mètres
//         const durationMinutes = Math.round(roundedDistance / averageSpeedMetersPerMinute); // Durée en minutes
//         return { ...user._doc, distance: roundedDistance, duration: durationMinutes };
//       });
//       // console.log(usersWithDistanceAndDuration);
    
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(usersWithDistanceAndDuration);
//     } catch (err) {
//       res.statusCode = 500;
//       res.setHeader('Content-Type', 'application/json');
//       res.json({ success: false, message: err.message });
//     }
//   });
  


// ratingRouter.route('/ratings/all')
// .get((req,res,next) => {
//    Ratings.aggregate([
//        {
//            $group: {
//                _id: "$prestataire",
//                averageRating: { $avg: { $toInt: "$rating" } },
//                count: { $sum: 1 }
//            }
//        },
//        {
//            $lookup: {
//                from: "users", // nom de la collection du prestataire
//                localField: "_id",
//                foreignField: "_id",
//                as: "prestataire_info"
//            }
//        },
//        { $unwind: "$prestataire_info" },
//        {
//            $match: {
//                averageRating: { $gte: 4 }
//            }
//        }
//    ])
//    .then((ratings) => {
//        res.statusCode = 200;
//        res.setHeader('Content-Type', 'application/json');
//        res.json(ratings);
//    }, (err) => next(err))
//    .catch((err) => next(err));
// })


// ratingRouter.route('/ratings/all')
// .get((req,res,next) => {
//     Ratings.aggregate([
//         {
//             $group: {
//                 _id: "$prestataire",
//                 averageRating: { $avg: { $toInt: "$rating" } },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $lookup: {
//                 from: "users", // nom de la collection du prestataire
//                 localField: "_id",
//                 foreignField: "_id",
//                 as: "prestataire_info"
//             }
//         },
//         { $unwind: "$prestataire_info" }
//     ])
//     .then((ratings) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(ratings);
//     }, (err) => next(err))
//     .catch((err) => next(err));
// })

// ratingRouter.route('/ratings/all')
// .get((req,res,next) => {
//    Ratings.aggregate([
//        {
//            $group: {
//                _id: "$prestataire",
//                totalRating: { $sum: "$rating" },
//                count: { $sum: 1 }
//            }
//        }
//    ])
//    .then((ratings) => {
//        res.statusCode = 200;
//        res.setHeader('Content-Type', 'application/json');
//        res.json(ratings);
//    }, (err) => next(err))
//    .catch((err) => next(err));
// })

.post(cors.corsWithOptions, (req, res, next) => {
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

ratingRouter.route('/:commentId')
// .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Ratings.findById(req.params.commentId)
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
    res.end('POST operation not supported on /comments/'+ req.params.commentId);
})
// .put((req, res, next) => {
//     Ratings.findById(req.params.commentId)
//     .then((comment) => {
//         if (comment != null) {
//             if (!comment.author.equals(req.user._id)) {
//                 var err = new Error('You are not authorized to update this comment!');
//                 err.status = 403;
//                 return next(err);
//             }
//             req.body.author = req.user._id;
//             Ratings.findByIdAndUpdate(req.params.commentId, {
//                 $set: req.body
//             }, { new: true })
//             .then((comment) => {
//                 Ratings.findById(comment._id)
//                 .populate('author')
//                 .then((comment) => {
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(comment); 
//                 })               
//             }, (err) => next(err));
//         }
//         else {
//             err = new Error('Comment ' + req.params.commentId + ' not found');
//             err.status = 404;
//             return next(err);            
//         }
//     }, (err) => next(err))
//     .catch((err) => next(err));
// })
.put((req, res, next) => {
    Ratings.findById(req.params.commentId)
    .then((publicite) => {
        if (publicite != null) {
            Ratings.findByIdAndUpdate(req.params.commentId, { $set: req.body }, { new: true })
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
            err = new Error('Publicite ' + req.params.commentId + ' introuvable');
            err.status = 404;
            return next(err);            
        }
    })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Ratings.findById(req.params.commentId)
    .then((comment) => {
        if (comment != null) {
            if (!comment.author.equals(req.user._id)) {
                var err = new Error('You are not authorized to delete this comment!');
                err.status = 403;
                return next(err);
            }
            Ratings.findByIdAndRemove(req.params.commentId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

ratingRouter.route('/ratings/:ratingId')
.get(authenticate.verifyUser, (req, res, next) => {
    const { author } = req.query;
    Ratings.find({ prestataire: req.params.ratingId, author })
    .populate('author')
    .then((produits) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(produits);
    })
    .catch((err) => next(err));
});


ratingRouter.route('/ratings/allusers/:ratingId')
.get(authenticate.verifyUser, (req, res, next) => {
 Ratings.find({ prestataire: req.params.ratingId})
 .populate('author')
 .populate('prestataire')
 .then((produits) => {
     let ratings = produits.map(product => Number(product.rating));
     let sum = ratings.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
     let average = sum / ratings.length;
     let prestataire = produits[0].prestataire; // Get the prestataire from the first product
     res.statusCode = 200;
     res.setHeader('Content-Type', 'application/json');
     res.json({average: average, prestataire: prestataire});
 })
 .catch((err) => next(err));
});

// ratingRouter.route('/ratings/all')
// .get((req,res,next) => {
//  Ratings.aggregate([
//      {
//          $group: {
//              _id: "$prestataire",
//              averageRating: { $avg: { $toInt: "$rating" } },
//              count: { $sum: 1 }
//          }
//      }
//  ])
//  .then((ratings) => {
//      res.statusCode = 200;
//      res.setHeader('Content-Type', 'application/json');
//      res.json(ratings);
//  }, (err) => next(err))
//  .catch((err) => next(err));
// })

// ratingRouter.route('/ratings/allusers/:ratingId')
// .get((req, res, next) => {
//     Ratings.find({ prestataire: req.params.ratingId})
//     .populate('author')
//     .then((produits) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(produits);
//     })
//     .catch((err) => next(err));
// });

module.exports = ratingRouter;