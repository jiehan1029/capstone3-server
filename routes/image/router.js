var express = require('express');
const router = express.Router();
var ImageUploader = require('../utils/imageUploader');

router.post('/', function (req, res) {
  
  var image = ImageUploader({
    data_uri: req.body.data_uri,
    filename: req.body.filename,
    filetype: req.body.filetype
  }).then(onGoodImageProcess, onBadImageProcess);

  function onGoodImageProcess(resp) {
    res.status(200).json({
      status: 'success',
      uri: resp
    });
  }

  function onBadImageProcess(resp) {
    res.status(400).json({
     status: 'error'
    });
  }
});

module.exports = {router};