'use strict';
// use mlab database for consistency
exports.PORT = process.env.PORT || 8080;
exports.DATABASE_URL = process.env.DATABASE_URL
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
exports.S3_KEY = process.env.S3_KEY;
exports.SE_SECRET=process.env.SE_SECRET;
exports.BUCKET_NAME=process.env.BUCKET_NAME;