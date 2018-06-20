'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path=require('path');
const config = require('../../config');
const router = express.Router();

const createAuthToken = function(user) {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', {session: false});

router.use(bodyParser.json());

// The user provides a username and password to login
router.post('/login', localAuth, (req, res) => {
  console.log('in login')
	const authToken = createAuthToken(req.user.serialize());
  res.cookie('username',req.user.username,
    {
      httpOnly:true,
      maxAge:18000000
    });  
  console.log('user login succeeded',req.user.username);
  res.status(200).json({authToken});
});

const jwtAuth = passport.authenticate('jwt', {session: false});

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.cookie('username',req.user.username,
    {
      httpOnly:true,
      maxAge:18000000
    });
  console.log('user auth refresh succeeded', req.user.username);
  res.status(200).json({authToken});
});

router.get('/logout',(req,res)=>{
  res.clearCookie('username');
  console.log('user logout succeeded', req.user.username);
  res.status(200).json({message:'user logged out successfully'});
});

module.exports = {router};