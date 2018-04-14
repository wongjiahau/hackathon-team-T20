// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const checkIfUserIsAuthorized = require("./faceRecognition1").checkIfUserIsAuthorized;
 
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.post('/checkIn', function(req, res) {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    console.log(req.files);

    for(var filename in req.files) {
        const file = req.files[filename];
        console.log(file);
        file.mv('./toBeClassified/temp.png', (err) => {
            if(err) {
                return res.status(500).send(err);
            }
            var username = checkIfUserIsAuthorized()
            if(username) {
                res.send({status : "SUCCESS", data: {username: username}});
            } else {
                res.send({status : "FAIL"});
            }
        });
    }

    // let sampleFile = req.files.sampleFile;
    
    // // Use the mv() method to place the file somewhere on your server
    // sampleFile.mv('./', function(err) {
    //     if (err)
    //     return res.status(500).send(err);
    
    //     res.send('File uploaded!');
    // });
    // res.json({ message: 'hooray! welcome to our api!' });   
});

router.get('/checkout', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.get('/register', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
