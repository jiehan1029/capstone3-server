'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// this method is used in displaying user account (doesn't display user password here)
UserSchema.methods.serialize = function() {
  return {
    username: this.username || '',
    id:this._id
  };
};

// this method is called in verifying user info and grant credential (JWT)
UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

// this method is called in creating user account
UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

// link to the 'user' collection in the database
const Users = mongoose.model('users', UserSchema);

module.exports = {Users};