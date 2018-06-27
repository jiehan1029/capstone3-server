const express = require('express');
const router = express.Router();
const jwtDecode=require('jwt-decode');

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

const {MyRecords}=require('../my-wall/models');
const {formatDate,strToDate}=require('../utils/format-date');

router.post('/ticket/:ticketId', function (req, res) {
  console.log('user request to upload image');

  // takes submitted file and saves it to a public folder
  let form = new formidable.IncomingForm();
  form.uploadDir = "./public/uploads";
  form.keepExtensions = true;

  form.parse(req, function(err, fields, files) {
    // `file` is the name of the <input> field of type `file`
    let old_path = files.file.path,
    file_ext = files.file.name.split('.').pop(),
    index = old_path.lastIndexOf('\\') + 1,
    file_name = old_path.substr(index),
    front_path = path.join('\\uploads\\', file_name),
    new_path=replaceAll(front_path);
    absolute_path = 'E:\\Thinkful\\capstone3\\capstone3-server\\public' + front_path;

    function replaceAll(str) {
      return str.replace(/\\/g, '/');
    };

    console.log('file size=',files.file.size)
    console.log('index:', index);
    console.log('old path:', old_path);
    console.log('new path:', new_path);
    console.log('file name:', file_name);
    console.log('absolute path:', absolute_path);
    
    fs.readFile(old_path, function(err, data) {
      fs.writeFile(absolute_path, data, function(err) {
        fs.unlink(old_path, function(err) {
          if (err) {
            res.status(500).json({'success': false});
          }else{
            const userAuth=req.headers.authorization.substr(7,);
            const username=jwtDecode(userAuth).user.username;
            const dateStr=fields.date || '2001-01-01';
            const dateObj=strToDate(dateStr);

            // check if already have image associated with current user, ticket and date
            MyRecords
            .find({username:username,ticketId:fields.ticketId,dateStr:dateStr})
            .then(docs=>{
              if(docs.length===0){
                MyRecords.create({
                  username:username,
                  ticketId:req.params.ticketId,
                  ticketName:fields.ticketName,
                  dateStr:dateStr,
                  date:dateObj,
                  imageUrl:[{
                    src:new_path,
                    comment:fields.comment
                  }]
                });
                res.status(201).json({message:'upload success'});
              }else{
                docs[0].imageUrl.push({
                  src:new_path,
                  comment:fields.comment
                });
                docs[0].save()
                .then(saved=>{
                  res.status(201).json({message:'upload success'});
                })
              }
            })
            .catch(err=>{
              console.log(err);
              res.status(500).json({message:'Internal Server Error'});
            });
          }
        });
      });
    });
  });
});

module.exports = {router}