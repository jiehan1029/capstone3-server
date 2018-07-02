'use strict';
// use mlab database for consistency
exports.PORT = process.env.PORT || 8080;
exports.DATABASE_URL = process.env.DATABASE_URL
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';