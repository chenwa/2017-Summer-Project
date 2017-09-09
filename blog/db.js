var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var db;
var postCollection;
var customCollection;
var context;
var settings;


var slugify = function(s){
  // Everything not a letter or number becomes a dash
  s = s.replace(/[^A-Za-z0-9]/g, '-');
  // Consecutive dashes become one dash
  s = s.replace(/\-+/g, '-');
  // Leading dashes go away
  s = s.replace(/^\-/, '');
  // Trailing dashes go away
  s = s.replace(/\-$/, '');
  // If the string is empty, supply something so that routes still match
  if (!s.length){
    s = 'none';
  }
  return s.toLowerCase();
}

var uniqueSlug = function(postSlug, callback){
  postCollection.findOne({slug: postSlug}, function(err, matchingPost){
    if(matchingPost){
      callback("Make sure your title is unique."); 
    }
    else if(postSlug == 'none' || postSlug == null || postSlug == ''){
      callback("Make sure your title is not blank.");
    }
    else{
      callback(null);
    }
  });  
}
var createUser = function(username, password, callback){
  var user = {
    user: username,
    password: password,
    backgroundColor: "white",
    color: "black",
  };
  callback(user);
}

module.exports = db = {
  // Initialize the module. Invokes callback when ready (or on error)
  init: function(contextArg, callback) {
    context = contextArg;
    settings = context.settings;
    // create db connection
    MongoClient.connect(settings.db.url, function(err, dataBase){
      assert.equal(null, err);
      postCollection = dataBase.collection('posts'); 
      customCollection = dataBase.collection('custom');
    }); 
    callback(null);
  },
  customize:{
    //Gets user's information and returns (err, user information)
    get: function(userArg, callback){
      customCollection.findOne({user: userArg}, function(err, custom){
        callback(err, custom);
      });
    },
    //Authenticates a user, retunrs (err, username)
    logIn: function(username, password, callback){
      customCollection.findOne({user: username, password: password}, function(err, user){
        if(user){
          callback(null, username);
        }else{
          callback("Username or Password is incorrect");
        }
      });
    },
    //Creates a new user, returns (err, username)
    newuser: function(username, password, callback){
      customCollection.findOne({user: username}, function(err, user){
        if(user || err){
          callback("Username Taken");
        }else{
          createUser(username, password, function(user){
            customCollection.insert(user, { safe: true }, function(err) { 
              if (err) { 
                callback(err); 
              } 
              else{ 
               callback(err, username); 
              } 
            });
          });
        }
      });
    },
    //Sets user's information, returns(err, user's information)
    set: function(userId, userSettings, callback){
      //If the user entered a new password
      if(userSettings.password != null && userSettings.password != ""){
        customCollection.update({user: userId}, {
          $set:{
            password: userSettings.password,
          }
        });
      }
      //Sets the Colors 
      customCollection.update({user: userId}, {
        $set:{
          backgroundColor: userSettings.backgroundColor,
          color: userSettings.textColor,
        }
      });
      customCollection.findOne({user: userId}, function(err, custom){
        console.log(custom);
        callback(null, custom);
      });
    },
  },
  posts: {
    findAll: function(callback){
      postCollection.find().sort({created: -1}).toArray(function(err, posts) {
        callback(err, posts);
      });
    },
    findOneBySlug: function(postSlug, callback) {
      postCollection.findOne({slug: postSlug}, function(err, post) {
        callback(err, post);
      });
    },
    insert: function(post, callback){
      post.slug = slugify(post.title);

      //check unique
      uniqueSlug(post.slug, function(err){ 
        if(err){
          callback(err);
        } 
        else{
          // Set the creation date/time
          post.created = new Date();

          postCollection.insert(post, { safe: true }, function(err) { 
            if (err) { 
              callback(err); 
            } 
            else{ 
             callback(err, post); 
            } 
          });
        }
      });
    },
    del: function(params){
      postCollection.deleteOne({slug: params.slug}); 
    },
    update: function(post, callback){
      post.slug = slugify(post.title);

      uniqueSlug(post.slug, function(err){
        //Makes sure the new slug is ok and skips if title is unchanged
        if(err && post.slug != post.oldSlug){
          callback(err);
        }
        else{
          postCollection.update({slug: post.oldSlug},
          {
            $set:{
              slug: post.slug,
              title: post.title,
              body: post.body,
            }
          });
          callback(null, post);
        }
      });
    },
  },
};



