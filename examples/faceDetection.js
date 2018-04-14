const { fr } = require('./commons')
const fs = require("fs");

fr.winKillProcessOnExit()

const detector = fr.FaceDetector()

// const DIR = './data/sample_faces/jiahau/'

function cropFaceOut(directory) {
    console.log(directory);
    fs.readdirSync(directory).forEach(path => {
        const img = fr.loadImage(directory + path);

        console.log('detecting faces for ' + path)
        const faceSize = 150
        const faces = detector.detectFaces(img, faceSize)
        if(faces.length == 1) {
            fr.saveImage(directory + path, faces[0]);
        }
    });
}

module.exports = {cropFaceOut}