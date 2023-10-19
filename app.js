var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var authenticate = require('./authenticate');
const connect = require('./db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var domaineActivites = require('./routes/domaineActivite');
var publiers = require('./routes/publier');
var commentaireRouter = require('./routes/commentaireRouter');
var photoProfilRouter = require('./routes/photoProfilRouter');

const cors = require('cors');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());

app.use(passport.initialize()); 

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// publiers.use(express.static('public/publicites'));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/domaineActivite', domaineActivites);
app.use('/publier', publiers);
app.use('/comments',commentaireRouter);
app.use('/photoProfils',photoProfilRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
