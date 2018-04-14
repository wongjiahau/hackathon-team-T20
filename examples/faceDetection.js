const { fr } = require('./commons')
const fs = require("fs");

fr.winKillProcessOnExit()

const detector = fr.FaceDetector()
const frontalDetector = new fr.FrontalFaceDetector()

/**
 * 
 * @param  directory: string . Must end with '/'
 */
function cropFaceOut(directory) {
    if(!directory.endsWith('/')) {
        throw new Error("Directory must end with '/'");
    }
    console.log(directory);
    fs.readdirSync(directory).forEach(path => {
        const img = fr.loadImage(directory + path);
        const faceRectangles = frontalDetector.detect(img);
        const biggestRectangle = faceRectangles.sort(x => x.area).reverse()[0];


        console.log('detecting faces for ' + path)
        const faceSize = 150
        const faces = detector.getFacesFromLocations(img, [biggestRectangle], faceSize);
        if(faces.length === 0) {
            return false;
        }
        fr.saveImage(directory + path, faces[0]);
    });
    return true;
}

module.exports = {cropFaceOut}