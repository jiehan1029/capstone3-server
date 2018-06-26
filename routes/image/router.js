var express = require('express');
const router = express.Router();
const jwtDecode=require('jwt-decode');
const bodyParser=require('body-parser');
router.use(bodyParser.json());

const {MyRecords}=require('../my-wall/models');
const {formatDate}=require('../utils/format-date');

router.post('/', function (req, res) {
  console.log('user request to upload image');
  const userAuth=req.headers.authorization.substr(7,);
  const username=jwtDecode(userAuth).user.username; 

  let currDate;
  if(typeof req.body.time === 'string'){
    currDate=req.body.time;
    console.log('req supplied time, ', currDate);
  }else{
    const currTime=new Date();
    currDate=formatDate(currTime);
    console.log('after conversion, currDate= ',currDate);
  }

  const data={
    username: username,
    ticketId: req.body.ticketId,
    uri: req.body.data_uri,
    time: currDate,
    text: req.body.text || ""
  };
  MyRecords.find({username:data.username, ticketId:data.ticketId, time:data.time})
  .then(docs=>{
    if(docs.length===0){
      console.log('did not found matching records, create new one')
      MyRecords.create({
        username:data.username,
        ticketId:data.ticketId,
        time:data.time,
        text:data.text,
        imageUrl:[data.uri]
      })
      .then(newDoc=>{
        res.status(201).json(newDoc);
      })
    }else{
      console.log('found previous records, add to it')
      docs[0].imageUrl.push(data.uri);
      docs[0].save(); 
      res.status(201).json(docs[0]);
    }
  })
  .catch(err=>{
    console.log(err);
    res.status(500).json({message:'Internal Server Error'});
  });  

});

module.exports = {router};