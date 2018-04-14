// server.js

// BASE SETUP
// =============================================================================
const DEST_IP = '192.168.20.107';

// call the packages we need
const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const checkIfUserIsAuthorized = require("./faceRecognition1").checkIfUserIsAuthorized;
const request = require('request');

 
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

router.post('/checkin', function(req, res) {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    checkUser(req.files, (response) => {
        res.send(response);
        request.post(
            `http://${DEST_IP}:8080/api/checkin`, 
            {json: response},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
            }
        );
    })
});

router.post('/checkout', function(req, res) {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    checkUser(req.files, (response) => {
        res.send(response);
        request.post(
            `http://${DEST_IP}:8080/api/checkout`, 
            {json: response},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
            }
        );
    })
});

function checkUser(files, callback) {
    for(var filename in files) {
        const file = files[filename];
        file.mv('./toBeClassified/temp.png', (err) => {
            if(err) {
                console.log(err);
                return;
            }
            var username = checkIfUserIsAuthorized()
            const response = username ? 
                {status : "SUCCESS", data: {username: username}, timestamp: new Date().getTime()} :
                {status : "FAIL", timestamp: new Date().getTime()};
            callback(response);
        });
    }

}

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
