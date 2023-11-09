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
.put((req, res, next) => {
    Ratings.findById(req.params.commentId)
    .then((comment) => {
        if (comment != null) {
            if (!comment.author.equals(req.user._id)) {
                var err = new Error('You are not authorized to update this comment!');
                err.status = 403;
                return next(err);
            }
            req.body.author = req.user._id;
            Ratings.findByIdAndUpdate(req.params.commentId, {
                $set: req.body
            }, { new: true })
            .then((comment) => {
                Ratings.findById(comment._id)
                .populate('author')
                .then((comment) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(comment); 
                })               
            }, (err) => next(err));
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
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
.get((req, res, next) => {
    Ratings.find({ prestataire: req.params.ratingId })
    .populate('author')
    .then((produits) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(produits);
    })
    .catch((err) => next(err));
});


module.exports = ratingRouter;