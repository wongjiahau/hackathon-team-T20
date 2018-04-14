// BASE SETUP
// =============================================================================
const DEST_IP = '192.168.20.107';

// call the packages we need
const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const checkIfUserIsAuthorized = require("./faceRecognition1").checkIfUserIsAuthorized;
const trainData = require("./faceRecognition1").trainData;
const predictNewlyTrainedData = require("./faceRecognition1").predictNewlyTrainedData;
const cropFaceOut = require("./faceDetection").cropFaceOut;
const request = require('request');
const fs = require("fs");

 
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(fileUpload());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.send("hello");   
});

router.post('/checkin', function(req, res) {
    console.log("Somebody is checking in . . .");
    checkUser(req.body.image, (response) => {
        console.log("Sending response back to client");
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
    console.log("Somebody is checking out . . .");
    checkUser(req.body.image, (response) => {
        res.send(response);
        console.log("Sending response back to client");
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

function checkUser(base64Image, callback) {
    const base64Data = base64Image;
    require("fs").writeFile("./toBeClassified/temp.png", base64Data, 'base64', function(err) {
        if(err) {
            console.log(err);
            return;
        }
        var username = checkIfUserIsAuthorized()
        const response = username ? 
            {status : "OK", data: {username: username}, timestamp: new Date().getTime()} :
            {status : "FAIL", timestamp: new Date().getTime()};
        callback(response);
    })
}

var CURRENT_USER = null;
router.post('/uploadUserData', (req, res) => {
    console.log("User is uploading data");
    const username = req.body.username;
    console.log("Name of user = " + username);
    const dirname = './data/faces/' + username;
    if(!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
        res.send({"status": "OK"});
    } else {
        res.send({"status": "FAIL", "data": {"message": "User existed"}});
    }
    CURRENT_USER = username;
})

router.post('/uploadUserFace', function(req, res) {
    console.log("uploading user face");
    if(!CURRENT_USER) {
        res.send({"status": "FAIL", "data": {"message": "Username is not provided"}});
        return;
    }

    const dirname = './data/faces/' + CURRENT_USER + "/" + (new Date().getTime()) + ".png";
    fs.writeFile(dirname, req.body.image, 'base64', function(err) {
        if(err) {
            console.log(err);
            res.send(err);
        }
    });
    setTimeout(() => {
        res.send("Registration success");
    }, 3000);
});

router.post("/registerUserFace", function(req, res) {
    console.log("Registering new user face");
    console.log("Cropping user face");
    cropFaceOut("./data/faces/" + CURRENT_USER + "/");

    console.log("Training data with new face");
    trainData();

    console.log("Predicting newly trained data");
    predictNewlyTrainedData();
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
