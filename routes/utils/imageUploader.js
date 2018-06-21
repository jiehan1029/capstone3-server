// http://www.benrlodge.com/blog/post/image-uploading-with-reactjs-nodejs-and-aws-s3
const Q = require('q');
const knox = require('knox');
const {S3_KEY, SE_SECRET, BUCKET_NAME} = require('../../config');

const ImageUploader = function(options){

  let deferred = Q.defer();
  let buf = new Buffer(options.data_uri.replace(/^data:image\/\w+;base64,/, ""),'base64');

  knoxClient = knox.createClient({
    key: S3_KEY,
    secret: SE_SECRET,
    bucket: BUCKET_NAME
  });

  // put to a path in our bucket, and make readable by the public
  req = knoxClient.put('/images/' + options.filename, {
   'Content-Length': buf.length,
   'Content-Type': options.filetype,
   'x-amz-acl': 'public-read' 
  });

  req.on('response', function(res) {
    if (res.statusCode === 200) {
      deferred.resolve(req.url);
    } else
      deferred.reject({error: 'true'});
  });

  req.end(buf);
  return deferred.promise;
}

module.exports = ImageUploader;