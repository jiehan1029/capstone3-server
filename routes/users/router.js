'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {Users} = require('./models');

const router = express.Router();

// use front-end form validator to make sure submitted data are valid
// (correct type, contains required contents, no whitespace, have right size, etc)

// Post to register a new user
router.post('/', jsonParser, (req, res) => {

  let {username, password} = req.body;

  // check if conflicts database and create an account if no conflict
  return Users.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return Users.hashPassword(password);
    })
    .then(hash => {
      return Users.create({
        username,
        password: hash
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message:'Internal Server Error'});
    });
});

module.exports = {router};