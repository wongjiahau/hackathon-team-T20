const path = require('path')
const fs = require('fs')
const {
  fr,
  getAppdataPath,
  ensureAppdataDirExists
} = require('./commons')

fr.winKillProcessOnExit()
ensureAppdataDirExists()



const numTrainFaces = 7
const trainedModelFile = `faceRecognition1Model_t${numTrainFaces}_150.json`
const trainedModelFilePath = path.resolve(getAppdataPath(), trainedModelFile)
const recognizer = fr.FaceRecognizer()
if(fs.existsSync(trainedModelFilePath)) {
  recognizer.load(require(trainedModelFilePath));
}

// const PATH = './data/faces/';
const PATH = './data/faces/';
const dataPath = path.resolve(PATH);
const classNames = fs.readdirSync(dataPath);  //Name of people : E.g. howard, lennard, raj, etc.

function getImagesByClass() {
  const imagesByClass = classNames.map(name => {
    const allFiles = fs.readdirSync(path.resolve(PATH + name));
    return allFiles.map(filename => { 
      return fr.loadImage(PATH + name + "/" + filename);
    });
    
  });
  return imagesByClass;
}



function trainData() {
  console.log("Training data");
  const imagesByClass = getImagesByClass();
  const trainDataByClass = imagesByClass.map(imgs => imgs.slice(0, numTrainFaces))
  const trainedFaces = recognizer.getDescriptorState().map(x => x.className);

  trainDataByClass.forEach((faces, label) => {
    const name = classNames[label]
    if(!trainedFaces.includes(name)) {
      console.log("Adding faces of " + name + ". . .");
      const numJitters = 30; // Augment the data to produce more training
      recognizer.addFaces(faces, name, numJitters)
    }
  })

  console.log("Training finished. Saving model . . .");
  fs.writeFileSync(trainedModelFilePath, JSON.stringify(recognizer.serialize()));
  console.log("FINISHED.");
}


function predictNewlyTrainedData() {
  console.log(recognizer.getDescriptorState().map(x => x.className));

  console.log('imported the following descriptors:')
  console.log(recognizer.getDescriptorState())
  const imagesByClass = getImagesByClass();
  const testDataByClass = imagesByClass.map(imgs => imgs.slice(numTrainFaces))

  const errors = classNames.map(_ => 0)
  testDataByClass.forEach((faces, label) => {
    const name = classNames[label]
    console.log()
    console.log('testing %s', name)
    faces.forEach((face, i) => {
      const prediction = recognizer.predictBest(face)
      console.log('%s (%s)', prediction.className, prediction.distance)

      // count number of wrong classifications
      if (prediction.className !== name) {
        errors[label] = errors[label] + 1
      }
    })
  })

  // print the result
  const result = classNames.map((className, label) => {
    const numTestFaces = testDataByClass[label].length
    const numCorrect = numTestFaces - errors[label]
    const accuracy = parseInt((numCorrect / numTestFaces) * 10000) / 100
    return `${className} ( ${accuracy}% ) : ${numCorrect} of ${numTestFaces} faces have been recognized correctly`
  })
  console.log('result:')
  console.log(result)
}

function checkIfUserIsAuthorized() {
  const imagePath = './toBeClassified/temp.png';
  const detector = fr.FaceDetector()
  console.log('detecting faces')
  const faceSize = 150
  console.log(imagePath);
  const faces = detector.detectFaces(fr.loadImage(imagePath), faceSize);
  if(faces.length < 1) {
    console.log("No faces detected");
    return null;
  }
  fr.saveImage(imagePath, faces[0]);
  recognizer.load(require(trainedModelFilePath));
  const prediction = recognizer.predictBest(faces[0]);
  console.log(prediction);
  const CUT_POINT = 0.45; // The CUT_POINT is defined based on heuristic
  if(prediction.distance < CUT_POINT) {
    console.log("Face recognized.");
    return prediction.className;
  }
  console.log("Unrecognized faced");
  return null;
}

// trainData();
// predictNewlyTrainedData();
// checkIfUserIsAuthorized();


module.exports = {trainData, checkIfUserIsAuthorized, predictNewlyTrainedData};
