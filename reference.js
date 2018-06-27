// upload an image

const express = require('express');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const passport = require('passport');

const fs = require('fs');

const path = require('path');

const bodyParser = require('body-parser');

const http = require('http');

const formidable = require('formidable');

router.post('/uploads/:id', ensureAuthenticated, function(req, res) {

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {

        // `file` is the name of the <input> field of type `file`

        var old_path = files.file.path,

            file_size = files.file.size,

            file_ext = files.file.name.split('.').pop(),

            index = old_path.lastIndexOf('\\') + 1,

            file_name = old_path.substr(index),

            // file_name = "image";

            mid_path = path.join('\\users\\uploads\\', file_name + '.' + file_ext),

            front_path = path.join('\\uploads\\', file_name + '.' + file_ext),

            new_path=replaceAll(front_path),

            absolute_path = 'D:\\Dropbox\\Thinkful\\photo-App\\public' + mid_path;

        function replaceAll(str) {

            return str.replace(/\\/g, '/');

        };

        console.log('index:', index);

        console.log('old path:', old_path);

        console.log('new path:', new_path);

        console.log('file name:', file_name);

        console.log('absolute path:', absolute_path);



        fs.readFile(old_path, function(err, data) {

            fs.writeFile(absolute_path, data, function(err) {

                fs.unlink(old_path, function(err) {

                    if (err) {

                        res.status(500);

                        res.json({'success': false});

                    } else {

                            // find the user in database using the req.user.email

                            User.findOne({email: req.user.email})

                            .then(user => {

                                // check if this string is already in the portfolio

                                if(!user.portfolio) {

                                    user.portfolio = [];

                                }

                                let arrayContainsPath = (user['portfolio'].indexOf(new_path) > -1);

                                if (!arrayContainsPath) {

                                    user.portfolio.push(new_path);

                                    user.save()

                                    .then(

                                       

                                        user =>

                                        {req.flash('success_msg', 'Image uploaded succesfully');

                                        res.redirect(`../bio-photo/${req.params.id}`);

                                    })



                                }

                                else {

                                    req.flash('error_msg', 'Image already uploaded');

                                    res.redirect(`../bio-photo/${req.params.id}`);

                                }

                            })

                    }

                });

            });

        });





        



    });

});