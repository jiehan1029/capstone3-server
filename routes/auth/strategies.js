// this is to create strategies for passport and will be registered in server.js

'use strict';

// create local strategy to verify username and password are valid (match database record)
const { Strategy: LocalStrategy } = require('passport-local');

// Assigns the Strategy export to the name JwtStrategy using object destructuring
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Assigning_to_new_variable_names
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { Users } = require('../users/models');
const { JWT_SECRET } = require('../../config');

const localStrategy = new LocalStrategy((username, password, callback) => {
  let user;
  Users.findOne({ username: username })
    .then(_user => {
      user = _user;
      if (!user) {
        // Return a rejected promise so we break out of the chain of .thens.
        // Any errors like this will be handled in the catch block.
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      // .validatePasswords() is the model instance method defined in models.js for the database model 'User'
      return user.validatePassword(password);
    })
    .then(isValid => {
      if (!isValid) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      return callback(null, user);
    })
    .catch(err => {
      if (err.reason === 'LoginError') {
        return callback(null, false, err);
      }
      return callback(err, false);
    });
});

const cookieExtractor = function(req) {
    let token = null;
    if (req && req.cookies)
    {
        token = req.cookies['jwt'];
    }
    console.log("extract jwt from cookies, "+token);
    return token;
};

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    // Look for the JWT as a Bearer auth header
    //jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
    // Only allow HS256 tokens - the same as the ones we issue
    algorithms: ['HS256']
  },
  (payload, done) => {
    done(null, payload.user);
  }
);

module.exports = { localStrategy, jwtStrategy };