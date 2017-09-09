/*
* File: blog.js
* Author: Warren Chen (based off of justjs tutorial)
* Date: 8/16/2017
* Description:
* This is the first file that is used. It initializes the database and app.
*/

// Modules
var async = require('async');

// Variables
var context = {};
context.settings = require('./settings');

async.series([setupDb, setupApp, listen], ready);

function setupDb(done){
  // Create our database object
  context.db = require('./db.js');

  // Set up the database connection, create context.db.posts object
  context.db.init(context, done);
}

function setupApp(done){
  // Create the Express app object and load our routes
  context.app = require('./app.js');
  context.app.init(context, done);
}

// Ready to roll - start listening for connections
function listen(done){
  context.app.listen(context.app.get('port'), function(){
    console.log('Node app is running on port', context.app.get('port'));
  });
  done();
}

function ready(err){
  if (err){
    throw err;
  }
  console.log("Ready");
}
