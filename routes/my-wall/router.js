const express = require('express');
const router = express.Router();
const bodyParser=require('body-parser');

const {MyRecords}=require('./models');

router.use(bodyParser.json());

// GET retrieve all tickets from user's bucket
router.get('/', (req, res) => {
  console.log(req.query);
  MyBucket.find({user:req.query.username})
    .then(resultArray => {
      const tickets = resultArray[0];
      res.status(200).json(tickets);
    })
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});      
    });
});

// POST create new ticket
// request supplies username, what, where, type and details
router.post('/',(req,res)=>{
  console.log(req.body);
  const requiredFields = ['username','what'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).json({message:message});
    }
  }

  // if the user doesnt have a bucket yet, create a bucket
  // otherwise update existing bucket
  MyBucket.find({username:req.body.username})
    .then(bucketArray=>{
      if(bucketArray.length===0){
        console.log('create a bucket and add a ticket for user ',req.body.username);
        return MyBucket.create({
          username:req.body.username,
          tickets:[{
            what:req.body.what,
            where:req.body.where,
            type:req.body.type,
            details:req.body.details
          }]
        })
        .then(ticket=>res.status(201).json(ticket.serialize()))
        .catch(err=>{
          console.error(err);
          res.status(500).json({message:'Internal Server Error'});
        })        
      }
      else if(bucketArray.length===1){
        const newTickets={
          what:req.body.what,
          where:req.body.where,
          type:req.body.type,
          details:req.body.details
        };
        bucketArray[0].tickets.push(newTickets);
      }
      else{
        return Promise.reject({
          code:500,
          reason:"Unexpected user data",
          message:"Internal Server Error",
          location:"Database"
        })
      }
    })
    .catch(err=>{
      console.error(err);
      res.status(500).json(err);
    });
});

// PUT update one ticket
// request.body supplies ticketId and fields to be updated
router.put('/:ticketId',(req,res)=>{
  console.log(req.body);
	// check recipe ticketId is supplied
	if (!req.body.ticketId || !req.body.username){
		const message=`missing required field {ticketId} or {username} in request body`;
		console.error(message);
		res.status(400).json({ message: message });
  }

  // allow to update: what, where, type, details
  const toUpdate = {};
  const updateableFields = ['what', 'where', 'type', 'details'];
  updateableFields.forEach( field => {
    if(field in req.body){
    	toUpdate[field] = req.body[field];
    }
  });

  // find the bucket to be updated using username
  MyBucket.find({username:req.body.username})
    .then(resArr=>{
      if(resArr.length!=1){
        return Promise.reject({
          code:500,
          reason:"Unexpected user data",
          message:"Internal Server Error",
          location:"Database"
        });
      }
      // find the ticket to be updated using ticketId
      let theTicket, theIndex;
      for(let i=0;i<resArr[0].tickets.length;i++){
        if(resArr[0].tickets[i]._id===req.body.ticketId){
          theTicket=resArr[0].tickets[i];
          theIndex=i;
          break;
        }
      }
      const updatedTicket=Object.assign({},theTicket,
      {
        what:req.body.what,
        where:req.body.where,
        details:req.body.details,
        type:req.body.type
      });
      resArr[0].tickets[theIndex]=updatedTicket;
    })
    .catch(err=>{
      console.error(err);
      res.status(500).json(err.message);
    });
});

// DELETE a ticket req.body supplies ticketId
router.delete('/:ticketId',(req,res)=>{
  const ticketId=req.body.ticketId;
  console.log(req.body);
  if(!req.body.username || !req.body.ticketId){
    const message='missing {username} or {ticketId} in request body';
    console.error(message);
    return res.status(400).json({message:message});
  }
  MyBucket
    .find({username:req.body.username})
    .then(resArr => {
      if(resArr.length!=1){
        return Promise.reject({
          code:500,
          reason:"Unexpected user data",
          message:"Internal Server Error",
          location:"Database"
        });
      }
      // find the ticket to be deleted using ticketId
      let theTicket, theIndex;
      for(let i=0;i<resArr[0].tickets.length;i++){
        if(resArr[0].tickets[i].ticketId===req.body.ticketId){
          theTicket=resArr[0].tickets[i];
          theIndex=i;
          break;
        }
      }
      resArr[0].tickets.splice(theIndex,1);
    	console.log(`Deleted ticket ${req.body.ticketId} from ${req.body.username}'s bucket`);
    	res.status(204).end();
    })
    .catch(err => res.status(500).json(err.message));
});

module.exports = {router};