var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var ObjectId = require('mongoose').Types.ObjectId;

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/fantasydb", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://bleacherreport.com/fantasy-football").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("li.articleSummary div.articleContent").each(function(i, element) {
      // Save an empty result object
      var result = {};
      // console.log(result);

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a.articleTitle")
        .children("h3")
        .text();
      result.link = $(this)
        .children("a.articleTitle")
        .attr("href");

      // console.log(this);

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find()
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    console.log(err);
    res.json(false);
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.find({ _id: new ObjectId(req.params.id)})
  .then(data => {
    res.json(data);
  })
  .catch(error => {
    console.log(error);
    res.json(false);
  });
  ;
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  
  // create a note
  db.Note.create(req.body)
  .then( data => {
    // get the note id from the data
    var noteId = data._id;
    // find the article by the params.id and update using the note id
    db.Article.findOneAndUpdate({ _id: new ObjectId(req.params.id)} , {$set: {note: noteId}})
    .populate('note')
    .then( articleData => {
      res.json(articleData);
    });
  })
  .catch(error => {
    console.log(error);
    res.json(false);
  });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
