const express = require('express');
const router = express.Router();

const fs=require('fs');
const path = require('path');

// bodyParser middleware cannot be used with formidable
const bodyParser=require('body-parser');
//router.use(bodyParser.json());

// to handle formData and file upload
const formidable = require('formidable');

const jwtDecode=require('jwt-decode');

const {MyRecords}=require('./models');
const {strToDate}=require('../utils/format-date');

// GET retrieve all records of the user
router.get('/', (req, res) => {
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;  
  MyRecords.find({username:username})
    .then(resultArray => {
      let records=[];
      resultArray.forEach(result=>{
        records.push(result.serialize());
      });
      console.log(`retrieved ${records.length} records for user ${username}`);
      res.status(200).json(records);
    })
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});      
    });
});

// POST create new record (photo collection) for a specific ticket & date
router.post('/ticket/:ticketId', function (req, res) {
  console.log('user request to upload image');

  // takes submitted file and saves it to a public folder
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, function(err, fields, files) {
    // `file` is the name of the <input> field of type `file`
    let old_path = files.file.path,
    index = old_path.lastIndexOf('\\') + 1,
    file_name = old_path.substr(index),
    front_path = path.join('\\uploads\\', file_name),
    absolute_path = 'E:\\Thinkful\\capstone3\\capstone3-server\\public' + front_path,
    access_path='http://localhost:8080'+replaceAll(front_path);

    function replaceAll(str) {
      return str.replace(/\\/g, '/');
    };

    //console.log('absolute path:', absolute_path);
    //console.log('access_path',access_path);
    
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
                    src:access_path,
                    comment:fields.comment
                  }]
                });
                console.log('upload image success');
                res.status(201).json({message:'upload success'});
              }else{
                docs[0].imageUrl.push({
                  src:access_path,
                  comment:fields.comment
                });
                docs[0].save()
                .then(saved=>{
                  console.log('upload image success');
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

// PUT update a record of the ticket
router.put('/ticket/:ticketId/record/:recordId',bodyParser,(req,res)=>{
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  const ticketId=req.params.ticketId;
  const recordId=req.params.recordId;
  const toUpdate = {};
  const updateableFields = ['date', 'comment', 'src'];
  updateableFields.forEach( field => {
    if(field in req.body){
    	toUpdate[field] = req.body[field];
    }
  });
  // find the record to be updated
  MyRecords.find({_id:recordId})
    .then(record=>{
      const newRecord=Object.assign(record[0],toUpdate);
      record[0].set(newRecord);
      record[0].save();
      console.log(`updated record ${recordId} for ticket ${ticketId} of user ${username} successfully`);
      res.status(200).json(record);
    })
    .catch(err=>{
      console.error(err);
      res.status(500).json(err.message);
    });
});

// DELETE a whole collection of photos for a specific record
router.delete('/ticket/:ticketId/record/:recordId',(req,res)=>{
  // delete the photo files from storage
  const filePaths=[];
  MyRecords.find({_id:req.params.recordId})
  .then(docs=>{
    docs.map(doc=>{
      doc.imageUrl.map(imgObj=>{filePaths.push(imgObj.src);});
    });
    return filePaths;
  })
  .then(filePaths=>{
    filePaths.map(currPath=>{
      let index = currPath.lastIndexOf('/') + 1;
      let fileName = currPath.substr(index,);
      let memoryPath='E:\\Thinkful\\capstone3\\capstone3-server\\public\\uploads\\'+fileName;
      console.log('file to delete: ',fileName);
      fs.unlink(memoryPath, function(err){
        if(err) return console.error(err);
        console.log('delete photo successfully');
      });
    }); 

    MyRecords
    .findByIdAndRemove(req.params.recordId)
    .then(() => {
      console.log(`Deleted record ${req.params.recordId} from ticket ${req.params.ticketId}`);
      res.status(204).end();
    });
  })
  .catch(err=>{
    console.error(err);
    res.status(500).json({message:'Internal Server Error'});
  });
});

// DELETE a single photo
router.delete('/image/:imageId',(req,res)=>{
  const imageId=req.params.imageId;
  // delete photo url from the database and files from memory
  let filePath;
  MyRecords
  .find({"imageUrl._id":imageId})
  .then(docs=>{
    console.log('found doc containing img: ',docs);
    let toDelete;
    for(let i=0;i<docs[0].imageUrl.length;i++){
      if(docs[0].imageUrl[i]._id=imageId){
        toDelete=i;
        filePath=docs[0].imageUrl[i].src;
        break;
      }
    }
    // delete physical file
    let index = filePath.lastIndexOf('/') + 1;
    let fileName = filePath.substr(index,);
    let memoryPath='E:\\Thinkful\\capstone3\\capstone3-server\\public\\uploads\\'+fileName;  
    fs.unlink(memoryPath, function(err){
      if(err) return console.error(err);
      console.log('delete photo files successfully');
    });
    // delete database info
    docs[0].imageUrl.splice(toDelete,1);
    docs[0].save();
    console.log(`delete image ${imageId} from the record`);
    res.status(204).end();
  })
  .catch(err=>{
    console.error(err);
    res.status(500).json({message:'Internal Server Error'});
  })
})

module.exports = {router};