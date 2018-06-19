'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path=require('path');
const config = require('../../config');
const router = express.Router();

// import database model because when user login, res send basic info of user's recipebooks
const {RecipeBooks}=require('../recipe-books/models');

const createAuthToken = function(user) {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

// passport LocalStrategy must be defined in the strategies.js file, and registered in server.js using
/*
passport.use(localStrategy);
*/
const localAuth = passport.authenticate('local', {session: false});

router.use(bodyParser.json());

// The user provides a username and password to login
router.post('/login', localAuth, (req, res) => {
	const authToken = createAuthToken(req.user.serialize());
  // after login, save some info into cookies:
  // auth token (httpOnly), username, and recipe books the user created
  res.cookie('jwt',authToken,
    {
      httpOnly:true,
      maxAge:18000000
    });
  res.cookie('username',req.user.username,
    {
      maxAge:18000000
    });
  // get user's recipe books basic info (bookId and name) from database
  let userBooksList=[];
  RecipeBooks
    .find({user:req.user.username})
    .then(books=>{
      let bookList=books.map(book=>book.serialize())
      // only need id and name, nothing else
      for(let i=0;i<bookList.length;i++){
        userBooksList.push({'bookId':bookList[i].id,
        'name':bookList[i].name});
      }
      return userBooksList;
    })
    .then(arr=>{
      res.status(200).send(arr);
    })
    .catch(err=>{console.log(err);res.status(500).json({message: 'Internal server error'})})
});

// similarly, the strategy needs to be defined and registered
const jwtAuth = passport.authenticate('jwt', {session: false});

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/refresh', jwtAuth, (req, res) => {
    const authToken = createAuthToken(req.user);
    res.cookie('jwt',authToken,
      {
        httpOnly:true,
        maxAge:18000000
      });
    res.cookie('username',req.user.username,
      {
        maxAge:18000000
      });
    res.status(200).json({authToken});
});

router.get('/logout',(req,res)=>{
  res.clearCookie('username');
  res.clearCookie('jwt');
  res.status(200).json({message:'user cookie cleared, logout completed'});
});

router.get('/logout/protected',(req,res)=>{
  res.clearCookie('username');
  res.clearCookie('jwt');
  res.sendFile(path.join(__dirname,'../../public','logout-protected.html'));
});

module.exports = {router};