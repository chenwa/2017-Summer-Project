/*
* File: app.js
* Author: Warren Chen (based off of justjs tutorial)
* Date: 8/16/2017
* Description:
* Uses Express to load app
*/

//Modules
var _ = require('underscore'),
    express = require('express')
    bodyParser = require('body-parser'),
    assert = require('assert');

module.exports = {
  init: function(context, done) {
    // Create an Express app object to add routes to and add
    // it to the context
    var app = context.app = express();
    app.set('port', (process.env.PORT || 5000));
    
    // Use Body Parser
    app.use(bodyParser.urlencoded({ extended:false }));
    app.use(bodyParser.json());
    app.use(bodyParser.raw());
    app.use(bodyParser.text());
   
    // use pages
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    // use css
    app.use(express.static(__dirname + '/public'));
    
    var userId = 'default';
    var custom;
    var setCustom = function(userArg){
      context.db.customize.get(userArg, function(err, customCSS){
        custom = customCSS;
      });
    }

    // Deliver a list of posts when we see just '/'
    app.get('/', function(req, res){
      setCustom(userId);

      context.db.posts.findAll(function(err, posts){
        if (err){
          notFound(res);
          return;
        }
        res.render('./index', {
          posts: posts,
          custom: custom
        });
      });
    });

    // Deliver a specific post when we see /posts/ 
    app.get('/posts/:slug', function(req, res){
      setCustom(userId);
      context.db.posts.findOneBySlug(req.params.slug, function(err, post) {
        if (err || (!post))
        {
          notFound(res);
          return;
        }
        res.render('./post', {
          postSlug: post.slug,
          postTitle: post.title,
          postBody: post.body,
          custom: custom,
        });
      });
    });

    //delete post
    app.post('/posts/:slug', function(req, res){
      context.db.posts.del(req.params)
      res.redirect('/');
    });
    // Deliver a "new post" form when we see /new.
    // POST it right back to the same URL; the next route
    // below will answer 
    app.get('/new', function(req, res){
      setCustom(userId);
      newPost(res,null);
    });
    
    // Save a new post when we see a POST request
    // for /new (note this is enough to distinguish it
    // from the route above)
    app.post('/new', function(req, res){
      var post = _.pick(req.body, 'title', 'body');
      context.db.posts.insert(post, function(err, post){
        if (err){
          // Probably a duplicate slug, ask the user to try again
          // with a more distinctive title. We'll fix this
          // automatically in our next installment
          newPost(res, err);
        } 
        else{
          res.redirect('/posts/' + post.slug);
        }
      });
    });

    //Update Post Page
    app.get('/update/:slug', function(req, res) {
      setCustom(userId);
      context.db.posts.findOneBySlug(req.params.slug, function(err, post) {
        if (!post)
        {
          notFound(res);
          return;
        }
        else{
          res.render('./update', {
            postMessage: err,
            postSlug: post.slug,
            postTitle: post.title,
            postBody: post.body,
            custom: custom,
          });
        }
      });
    });
    //Update a Post
    app.post('/update/:slug', function(req, res) {
      var post = _.pick(req.body, 'title', 'body');
      post.oldSlug = req.params.slug;

      context.db.posts.update(post, function(err, updatedPost){
        if(err){
          res.render('./update', {
            postMessage: err,
            postSlug: req.params.slug,
            postTitle: post.title,
            postBody: post.body,
            custom: custom,
          });
        }
        else{
          res.redirect('/posts/' + updatedPost.slug);
        }
      });
    });
    
    // Send the "new post" page, with an error message if needed
    function newPost(res, message){
      res.render('./new', {
        postMessage: message,
        custom: custom,
      });
    }

    //Create User
    app.get('/newuser', function(req, res){
      res.render('./newuser', {
        custom: custom,
        errMessage: null, 
      });
    });
    app.post('/newuser', function(req, res){
      var userData = _.pick(req.body, 'username', 'password');

      context.db.customize.newuser(userData.username, userData.password, function(err, username){
        if(err){ 
          res.render('./newuser', {
            custom: custom,
            errMessage: err, 
          });
        }else{
          userId = username;
          setCustom(userId);
          res.redirect('/');
        }
      });  
    });

    //Login    
    app.get('/login', function(req, res){
      res.render('./login', {
        custom: custom,
        errMessage: null, 
      });
    });
    app.post('/login', function(req, res){
      var userData = _.pick(req.body, 'username', 'password');

      context.db.customize.logIn(userData.username, userData.password, function(err, username){
        if(err){
          res.render('./login', {
            custom: custom,
            errMessage: err, 
          });
        } else{
          userId = username;
          setCustom(userId);
          res.redirect('/');
        }
      });
    });

    //User Settings
    app.get('/settings', function(req, res){
      if(userId == "default"){
        res.redirect('/');
      } else{
        setCustom(userId);
        res.render('./settings', {
          custom: custom,
        });
      }
    });
    app.post('/settings', function(req, res){
      var userSettings = _.pick(req.body, 'backgroundColor', 'textColor', 'password');
      context.db.customize.set(userId, userSettings, function(err, newSettings){
        res.render('./settings', {
          custom: newSettings,
        });
      });
    });

    //Logout
    app.get('/logout', function(req, res){
      userId = "default";
      setCustom("default");
      res.redirect('/');
    });

    //Catch rest of pages
    app.get('*', function(req, res) {
      notFound(res);
    });

    // The notFound function is factored out so we can call it
    // both from the catch-all, final route and if a URL looks
    // reasonable but doesn't match any actual posts

    function notFound(res)
    {
      res.status(404).send('<a href="/"><h1>Page not found. Click to go back.</h1></a>');
    }

    // We didn't have to delegate to anything time-consuming, so
    // just invoke our callback now
    done();
  }
};
