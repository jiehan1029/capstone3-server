// make two collections, MyBucket and Records
// MyBucket stores tickets, Records stores the completed activities
// define MyBucket here in my-bucket route, and Records in my-wall route
// Two collections are linked via username and ticketId

'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Tickets = mongoose.Schema({
  what:{type:String, required:true},
  where:{type:String, default:""},
  type:{type:String, default:"unsorted"},
  details:{type:String, default:""},
  // ticketId is not database generated Id but index in the tickets array
  ticketId:{type:Number}
});

const MyBucketSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  tickets: {type:[Tickets]}
});

MyBucketSchema.methods.serialize = function() {
  return {
    tickets: this.tickets || []
  };
};

const MyBucket = mongoose.model('mybucket', MyBucketSchema);
module.exports = {MyBucket};