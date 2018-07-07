const express = require('express');
const router = express.Router();
const jwtDecode=require('jwt-decode');
// bodyParser middleware cannot be used with formidable
const bodyParser=require('body-parser');
// to handle formData and file upload
const formidable = require('formidable');

const {MyRecords}=require('./models');
const {strToDate}=require('../utils/format-date');

const cloudinary = require('cloudinary');
const {CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET}=require('../../config');
cloudinary.config({ 
  cloud_name: CLOUD_NAME, 
  api_key: CLOUD_KEY, 
  api_secret: CLOUD_SECRET 
});

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
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username; 

  // takes submitted file and saves it to a public folder
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, function(err, fields, files) {
    // `file` is the name of the <input> field of type `file`
    let imgPath = files.file.path;
    let uploadSecUrl,publicId;
    cloudinary.uploader.upload(imgPath,function(apiRes){
      uploadSecUrl=apiRes.secure_url;
      publicId=apiRes.public_id;
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
              src:uploadSecUrl,
              publicId:publicId,
              comment:fields.comment
            }]
          });
          console.log('upload image success, public_id: ',publicId);
          res.status(201).json({message:'upload success'});
        }else{
          docs[0].imageUrl.push({
            src:uploadSecUrl,
            publicId:publicId,
            comment:fields.comment
          });
          docs[0].save()
          .then(saved=>{
            console.log('upload image success, public_id: ',publicId);
            res.status(201).json({message:'upload success'});
          })
        }
      })
      .catch(err=>{
        console.log(err);
        res.status(500).json({message:'Internal Server Error'});
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
  const publicIds=[];
  MyRecords.find({_id:req.params.recordId})
  .then(docs=>{
    docs.map(doc=>{
      doc.imageUrl.map(imgObj=>{publicIds.push(imgObj.publicId);});
    });
    return publicIds;
  })
  .then(publicIds=>{
    publicIds.map(currPublicId=>{
      cloudinary.v2.uploader.destroy(currPublicId,(err,result)=>{
        if(err){
          console.error('Error: deleting image from cloudinary - ',err);
        }else{
          console.log('Success: deleted image from cloudinary - ',result);
        }
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
  let imgPublicId;
  MyRecords
  .find({"imageUrl._id":imageId})
  .then(docs=>{
    let toDelete;
    for(let i=0;i<docs[0].imageUrl.length;i++){
      if(docs[0].imageUrl[i]._id=imageId){
        toDelete=i;
        imgPublicId=docs[0].imageUrl[i].publicId;
        break;
      }
    }
    // delete file from cloudinary
    cloudinary.v2.uploader.destroy(imgPublicId,(err,result)=>{
      console.log(result);
    })

    // delete database info
    docs[0].imageUrl.splice(toDelete,1);
    docs[0].save();
    console.log(`delete image (publicId: ${imgPublicId}) from the record`);
    res.status(204).end();
  })
  .catch(err=>{
    console.error(err);
    res.status(500).json({message:'Internal Server Error'});
  })
})

module.exports = {router};