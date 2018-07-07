'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const RecordsSchema = mongoose.Schema({
  username:{type:String, required:true},
  ticketId:{type:String, required:true},
  ticketName:{type:String},
  dateStr:{type:String},
  date:{type:Date, default: new Date('2000-01-01')},
  imageUrl:[{
    src:{type:String},
    publicId:{type:String},
    comment:{type:String}
  }]
});

RecordsSchema.methods.serialize=function(){
  return {
    ticketId:this.ticketId,
    ticketName:this.ticketName,
    dateStr:this.dateStr,
    date:this.date,
    imageUrl:this.imageUrl,
    id:this._id
  }
}

const MyRecords = mongoose.model('MyRecords',RecordsSchema);
module.exports = {MyRecords};