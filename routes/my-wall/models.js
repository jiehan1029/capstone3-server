'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const RecordsSchema = mongoose.Schema({
  username:{type:String, required:true},
  ticketId:{type:String, required:true},
  time:{type:Date, default: Date.now()},
  text:{type:String},
  imageUrl:[{type:String}]
});

RecordsSchema.methods.serialize=function(){
  return {
    ticketId:this.ticketId,
    time:this.time,
    text:this.text,
    imageUrl:this.imageUrl,
    id:this._id
  }
}

const MyRecords = mongoose.model('MyRecords',RecordsSchema);
module.exports = {MyRecords};