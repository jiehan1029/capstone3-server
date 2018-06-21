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
    res.send({
      status: 'success',
      uri: resp
    });
  }

  function onBadImageProcess(resp) {
    res.send({
     status: 'error'
    });
  }
});

module.exports = {router};