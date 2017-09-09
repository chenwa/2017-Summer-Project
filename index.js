// Setup Modules
var express = require('express'),
    app = express(),
    _ = require('underscore'),
    async = require('async');

// Setup Database
var context = {};
context.settings = require('./blog/settings');

async.series([setupDb, setupApp, listen], ready);

function setupDb(callback){
  context.db = require('./blog/db');
  context.db.init(context, callback);
}

function setupApp(callback){
  context.app = require('./blog/app');
  context.app.init(context, callback);
}

function listen(callback){
  context.app.listen(context.settings.http.port);
  callback(null);
}

function ready(err){
  if(err){
    throw err;
  }
  console.log("Ready and listening at http://localhost:" + 
                context.settings.http.port);
}

//blog tester   fold below
var posts = {
  'welcome-to-my-blog': {
    title: 'Welcome to my blog!',
    body: 'I am so glad you came.'
  },

  'i-am-concerned-about-stuff': {
    title: 'I am concerned about stuff!',
    body: 'People need to be more careful with stuff.'
  },

  'i-often-dream-of-trains': {
    title: 'I often dream of trains.',
    body: "I often dream of trains when I'm alone."
  }
};


app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


// index page
app.get('/', function(request, response) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    
    //test
    var postsDB;
    var col = db.collection('posts');

    // find
    postsDB = col.find({a:1}).toArray();

    console.log("posts:" + postsDB);
    
    var s = "<title>My Blog</title>\n";
    s += "<h1>My Blog</h1>\n";
    s += "<ul>\n";
    for (var slug in posts)
    {
      var post = posts[slug];
      s += '<li><a href="/posts/' + slug + '">' + post.title + '</a></li>' + "\n";
    }
    s += "</ul>\n";
    response.send(s);  


// Get to index.ejs
/*  response.render('pages/index', {
    //Sending Variables
    test: test,
    hello: 'hello passing variables'
  });
*/
  });
});

// individual posts 
//     - :slug is a variable declared by the url input
//        and is saved to req.params.VARIABLENAME
app.get('/posts/:slug', function(req, res) {
  var post = posts[req.params.slug];
  if (typeof(post) === 'undefined')
  {
    notFound(res);
    return;
  }
  var s = "<title>" + post.title + "</title>\n";
  s += "<h1>My Blog</h1>\n";
  s += "<h2>" + post.title + "</h2>\n";
  s += post.body;
  res.send(s);
});



// /cool and /times fold below
// route for tutorial - asciifaces
app.get('/cool', function(request, response) {
  response.send(cool());
});

// route for tutorial - times
app.get('/times', function(request, response) {
  var result = ''
  var times = process.env.Times || 5
  for(i=0; i<times; i++)
    result += i+ ' ';
  response.send(result);
});


// Database
app.get('/db', function (request, response) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    
    //test
    var col = db.collection('find');
    // Insert a single document
    col.insertMany([{a:1}, {a:1}, {a:1}], function(err, r) {
      assert.equal(null, err);
      assert.equal(3, r.insertedCount);

      // find
      col.find().toArray(function(err, docs) {
        assert.equal(null, err);
        assert(100 > docs.length);
        db.close();
        response.send(docs);
      });
    });
  });
});
  

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// Page not found
app.get('*', function (request, response) {
  response.status(404).send('<h1>Page Not Found. </h1>');
});



