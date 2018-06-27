'use strict';

// import env and config
require('dotenv').config();
const { PORT, DATABASE_URL } = require('./config');

// create app
const express = require('express');
const app = express();

// setup CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    // must use sendStatus or send, cannot use status
    return res.sendStatus(204);
  }
  next();
});

// https://medium.com/front-end-hacking/node-js-logs-in-local-timezone-on-morgan-and-winston-9e98b2b9ca45
const morgan = require('morgan');
// moment-timezone is used to dealwith timezone
const moment = require('moment-timezone');
morgan.token('date', (req, res) => {
  return moment().tz('America/Los_Angeles').format();
})
morgan.format('myformat', '[:date[clf]] ":method :url" :status :res[content-length] - :response-time ms');
app.use(morgan('myformat'));

// setup mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// import auth router, setup passport and jwt
const { router: authRouter, localStrategy, jwtStrategy } = require('./routes/auth');
const passport = require('passport');
passport.use(localStrategy);
passport.use(jwtStrategy);

// import other routers
const { router: usersRouter } = require('./routes/users');
const { router: myBucketRouter } = require('./routes/my-bucket');
const { router: myWallRouter } = require ('./routes/my-wall');
const { router: imageRouter } = require('./routes/image');

// serve static files
const path=require('path');
app.use(express.static(path.join(__dirname, '/public')));

// use routers
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
// routers for protected endpoints
const jwtAuth = passport.authenticate('jwt', { session: false });
app.use('/api/my-bucket', jwtAuth, myBucketRouter);
app.use('/api/my-wall',jwtAuth,myWallRouter);
app.use('/api/image',jwtAuth,imageRouter);

// catch any un-specified path
app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

let server;

function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };