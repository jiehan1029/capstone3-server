'use strict';
const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
	res.status(200).json({message:'server is functional'});
})

module.exports = {router};