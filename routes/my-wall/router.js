const express = require('express');
const router = express.Router();

const bodyParser=require('body-parser');
router.use(bodyParser.json());

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

// POST create new records for a specific ticket
// request supplies date (string, will be processed), imageUri, comment
router.post('/ticket/:ticketId',(req,res)=>{
  const ticketId=req.params.ticketId;
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  const requiredFields = ['imageUri','ticketName'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).json({message:message});
    }
  }

  const dateStr=req.body.date || '2001-01-01';
  const dateObj=strToDate(dateStr);
  MyRecords
    .create({
      username:username,
      ticketId:ticketId,
      ticketName:req.body.ticketName,
      dateStr:dateStr,
      date:dateObj,
      imageUrl:{
        src:imageSrc || '',
        comment:req.body.comment || ''
      }
    })
    .then(newRecord=>{
      console.log(`create new record ${newRecord._id} for ticket ${ticketId} of user ${username}`);
      res.status(201).json(newRecord);
    })
    .catch(err=>{
      console.error(err);
      res.status(500).json({message:'Internal Server Error'});
    });
});

// PUT update a record of the ticket
// request.body supplies fields to be updated
router.put('/ticket/:ticketId/record/:recordId',(req,res)=>{
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

// DELETE a record req.body supplies ticketId
router.delete('/ticket/:ticketId/record/:recordId',(req,res)=>{
  MyRecords
    .findByIdAndRemove(req.params.recordId)
    .then(() => {
    	console.log(`Deleted record ${req.params.recordId} from ticket ${req.params.ticketId}`);
    	res.status(204).end();
    })
    .catch(err => res.status(500).json(err.message));
});

module.exports = {router};