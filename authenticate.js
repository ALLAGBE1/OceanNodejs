var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config.js');

passport.use(new LocalStrategy({
    usernameField: 'username', // le champ utilisé pour le nom d'utilisateur
    passwordField: 'password' // le champ utilisé pour le mot de passe
}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// exports.getToken = function(user) {
//     return jwt.sign(user, config.secretKey,
//         {expiresIn: 3600});
// };

exports.getToken = function(user) {
    const expiresIn = 90 * 24 * 60 * 60;
    return jwt.sign(user, config.secretKey,
        {expiresIn});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

// exports.jwtPassport = passport.use(new JwtStrategy(opts,
//     (jwt_payload, done) => {
//         console.log("JWT payload: ", jwt_payload);
//         User.findOne({_id: jwt_payload._id}, (err, user) => {
//             if (err) {
//                 return done(err, false);
//             }
//             else if (user) {
//                 return done(null, user);
//             }
//             else {
//                 return done(null, false);
//             }
//         });
//     }));


exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload: ", jwt_payload);
    User.findOne({ _id: jwt_payload._id })
        .then(user => {
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        })
        .catch(err => {
            return done(err, false);
        });
}));



exports.verifyUser = passport.authenticate('jwt', {session: false});
exports.verifyAdmin = (req, res, next) => {
    if (req.user.admin)
        next();
    else {
        var err = new Error("Vous n'êtes pas autorisé ")
        err.status = 403;
        return next(err);
    }
};

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({facebookId: profile.id}, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (!err && user !== null) {
            return done(null, user);
        }
        else {
            user = new User({ username: profile.displayName });
            user.facebookId = profile.id;
            user.firstname = profile.name.givenName;
            user.lastname = profile.name.familyName;
            user.save((err, user) => {
                if (err)
                    return done(err, false);
                else
                    return done(null, user);
            })
        }
    });
}
));
