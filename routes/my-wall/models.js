'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const RecordsSchema = mongoose.Schema({
  username:{type:String, required:true},
  ticketId:{type:String, required:true},
  time:{type:Date},
  text:{type:String},
  imageUrl:[{type:String}]
});

RecordsSchema.methods.serialize=function(){
  return {
    username:{type:String, required:true},
    ticketId:{type:String, required:true},
    time:{type:Date},
    text:{type:String},
    imageUrl:[{type:String}]
  }
}

const MyRecords = mongoose.model('MyRecords',RecordsSchema);
module.exports = {MyRecords};