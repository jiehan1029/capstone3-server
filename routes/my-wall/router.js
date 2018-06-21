const express = require('express');
const router = express.Router();

const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');
router.use(bodyParser.json());
router.use(cookieParser());

const {MyRecords}=require('./models');

// GET retrieve all records of the user
router.get('/', (req, res) => {
  MyRecords.find({username:req.cookies.username})
    .then(resultArray => {
      let records=[];
      resultArray.forEach(result=>{
        records.push(result.serialize());
      });
      console.log(`retrieved ${records.length} records for user ${req.cookies.username}`);
      res.status(200).json(records);
    })
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});      
    });
});

// POST create new records for a specific ticket
// request supplies time, text, imageUrl (array)
// test ticketid   5b2b03c2c4bb323a407743d9
router.post('/ticket/:ticketId',(req,res)=>{
  const ticketId=req.params.ticketId;
  const username=req.cookies.username;
  const requiredFields = ['text'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).json({message:message});
    }
  }

  MyRecords
    .create({
      username:username,
      ticketId:ticketId,
      time:req.body.time || Date.now(),
      text:req.body.text,
      imageUrl:req.body.imageUrl || []
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
  const username=req.cookies.username;
  const ticketId=req.params.ticketId;
  const recordId=req.params.recordId;
  const toUpdate = {};
  const updateableFields = ['time', 'text', 'imageUrl'];
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
    	console.log(`Deleted record ${req.params.recordId} from ticket ${req.params.ticketId} for user ${req.cookies.username}`);
    	res.status(204).end();
    })
    .catch(err => res.status(500).json(err.message));
});

module.exports = {router};