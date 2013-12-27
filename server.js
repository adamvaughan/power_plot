'use strict';

var express = require('express');
var path = require('path');
var formidable = require('formidable');
var app = express();
var env = app.get('env');
var port = process.env.PORT || 3000;
var parser = require('./lib/parser');

process.env.NODE_ENV = env;

app.configure('development', function () {
  app.use(require('connect-livereload')());
  app.use(express.static(path.join(__dirname, '.tmp')));
  app.use(express.static(path.join(__dirname, 'app')));
  app.use(express.errorHandler());
  app.set('views', path.join(__dirname, 'app', 'views'));
  app.use(express.logger('dev'));
});

app.configure(function () {
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(app.router);
});

app.get('/*', function (request, response, next) {
  if (request.accepted.length > 0 && request.accepted[0].value === 'text/html') {
    response.render('index');
  } else {
    next();
  }
});

app.post('/upload', function (request, response, next) {
  var form = new formidable.IncomingForm();

  form.parse(request, function (error, fields, files) {
    if (error) {
      return next(error);
    }

    if (!files) {
      return response.send(400, 'Bad Request');
    }

    var file = files.file.path;

    parser.parse(file)
      .then(function (contents) {
        response.send(200, contents);
      })
      .otherwise(function (error) {
        response.send(500, error);
      });
  });
});

module.exports = app;

if (!module.parent) {
  app.listen(port, function () {
    console.log('Express server listening on port %d in %s mode', port, env);
  });
}
