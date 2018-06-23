const express = require('express');
const router = express.Router();
const bodyParser=require('body-parser');
const jwtDecode=require('jwt-decode');

const {MyBucket}=require('./models');

router.use(bodyParser.json());

// GET retrieve all tickets from user's bucket
router.get('/', (req, res) => {
  console.log("visitor ip address is ", req.connection.remoteAddress);
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  MyBucket.find({username:username})
    .then(resultArray => {
      const tickets = resultArray[0].serialize().tickets;
      //console.log(tickets);
      console.log(`retrieved ${tickets.length} tickets for user: ${username}`);
      res.status(200).json(tickets);
    })
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});      
    });
});

// POST create new ticket
// request supplies what, where, type and details
router.post('/',(req,res)=>{
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  console.log('user: ',username, ' made a request');
  console.log(req.body);
  const requiredFields = ['what'];
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
  MyBucket.find({username:username})
    .then(bucketArray=>{
      if(bucketArray.length===0){
        console.log('create a bucket and add a ticket for user: ',username);
        return MyBucket.create({
          username:username,
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
        bucketArray[0].save();
        res.status(200).json(bucketArray[0].tickets);
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
// request.body fields to be updated
router.put('/ticket/:ticketId',(req,res)=>{
  // ticketId is stored in req.params.ticketId
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  console.log(username, ' made a request');
  const ticketId=req.params.ticketId;
  // allow to update: what, where, type, details
  const toUpdate = {};
  const updateableFields = ['what', 'where', 'type', 'details'];
  updateableFields.forEach( field => {
    if(field in req.body){
    	toUpdate[field] = req.body[field];
    }
  });

  // to update the subdocument in an array using set and save
  // https://stackoverflow.com/questions/40642154/use-mongoose-to-update-subdocument-in-array
  MyBucket.find({"username":username})
    .then(resArr=>{
      const toUpdateTicket=Object.assign(resArr[0].tickets.id(ticketId),toUpdate);
      let subDoc=resArr[0].tickets.id(ticketId);
      subDoc.set(toUpdateTicket);
      resArr[0].save().then(savedDoc=>{
        console.log(`update ticket: ${ticketId} successfully`)
        res.status(200).json(savedDoc);
      })
    })
    .catch(err=>{
      console.error(err);
      res.status(500).json({message:'Internal Server Error'});
    });
});

// DELETE a ticket
router.delete('/ticket/:ticketId',(req,res)=>{
  const ticketId=req.params.ticketId;
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username;
  console.log(username, ' made a request');
  MyBucket
    .find({username:username})
    .then(resArr => {
      if(resArr.length!=1){
        return Promise.reject({
          code:500,
          reason:"Unexpected user data",
          message:"Internal Server Error",
          location:"Database"
        });
      }
      // find the ticket and remove it
      resArr[0].tickets.id(ticketId).remove();
      resArr[0].save();
    	console.log(`Deleted ticket ${ticketId} from: ${username}'s bucket`);
    	res.status(204).end();

    })
    .catch(err => res.status(500).json(err.message));
});

module.exports = {router};