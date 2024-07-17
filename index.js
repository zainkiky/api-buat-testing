const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

var upload = multer({ dest: 'uploads/' });

dotenv.config();

const Tambanng = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

var corsOptions = {
  origin: `${HOST}:${PORT}`,
};

Tambanng.use(cors(corsOptions));

// Middleware
Tambanng.use(morgan('dev'));
Tambanng.use(bodyParser.urlencoded());
Tambanng.use(bodyParser.json());

// Routes
Tambanng.get('/', (req, res) => {
  res.send('Hello');
});

const { db } = require('./firebase');
db.settings({ ignoreUndefinedProperties: true });

// Dummy Data for response
const dummyRes = {
  LastVersion: 2,
  TotalNode: 4,
  TotalRepeater: 2,
  CalBatPusat: 1.03,
  CalBatS1: 1.0,
  CalBatS2: 1.0,
  CalBatS3: 1.0,
  TimeReportPeriodic: 15,
  TimePeriodicSensor: 5,
  CalTempM1: 1.0,
  CalTempM2: 1.0,
  CalTempM3: 1.0,
  CalTempB1: 0.0,
  CalTempB2: 0.0,
  CalTempB3: 0.0,
  CalHumM1: 1.0,
  CalHumM2: 1.0,
  CalHumM3: 1.0,
  CalHumB1: 0.0,
  CalHumB2: 0.0,
  CalHumB3: 0.0,
  JumlahSensor: 3,
  CRC32Web: 'HGFEDCBA',
};

// Add periodic value
Tambanng.post('/Tambang/periodic/:id', async (req, res) => {
  //Save data to database
  await db.collection('Tambang').doc(req.params.id).set(req.body);

  const body = req.body;
  body.id = req.params.id;

  //Send response
  const result = JSON.stringify(body);
  console.log(result);
  res
    .status(200)
    .send(
      `${dummyRes.LastVersion},${dummyRes.TotalNode},${dummyRes.TotalRepeater},${dummyRes.CalBatPusat},${dummyRes.CalBatS1},${dummyRes.CalBatS2},${dummyRes.CalBatS3},${dummyRes.TimeReportPeriodic},${dummyRes.TimePeriodicSensor},${dummyRes.CalTempM1},${dummyRes.CalTempM2},${dummyRes.CalTempM3},${dummyRes.CalTempB1},${dummyRes.CalTempB2},${dummyRes.CalTempB3},${dummyRes.CalHumM1},${dummyRes.CalHumM2},${dummyRes.CalHumM3},${dummyRes.CalHumB1},${dummyRes.CalHumB2},${dummyRes.CalHumB3},${dummyRes.JumlahSensor},${dummyRes.CRC32Web}`
    );
});

Tambanng.post('/test', async (req, res) => {
  //Send response
  res
    .status(200)
    .send(
      `${dummyRes.LastVersion},${dummyRes.TotalNode},${dummyRes.TotalRepeater},${dummyRes.CalBatPusat},${dummyRes.CalBatS1},${dummyRes.CalBatS2},${dummyRes.CalBatS3},${dummyRes.TimeReportPeriodic},${dummyRes.TimePeriodicSensor},${dummyRes.CalTempM1},${dummyRes.CalTempM2},${dummyRes.CalTempM3},${dummyRes.CalTempB1},${dummyRes.CalTempB2},${dummyRes.CalTempB3},${dummyRes.CalHumM1},${dummyRes.CalHumM2},${dummyRes.CalHumM3},${dummyRes.CalHumB1},${dummyRes.CalHumB2},${dummyRes.CalHumB3},${dummyRes.JumlahSensor},${dummyRes.CRC32Web}`
    );
});

// Add mTambannging location device
Tambanng.post('/Tambang/:id', async (req, res) => {
  //Save data to database
  await db.collection('Tambang').doc(req.params.id).update(req.body);

  //Send response
  res.status(200).send('Success!');
});

// csv to json
Tambanng.post('/Tambang/csv/:id', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // Remove file
      fs.unlinkSync(filePath);

      const reff = db.collection('Tambang').doc(req.params.id);
      results.forEach(async (data) => {
        const resultData = {
          Timestamp: data.Timestamp,
          Humidity1: data['Humidity 1'],
          Temperature1: data['Temperature 1'],
          Battery1: data['Battery 1'],
          Humidity2: data['Humidity 2'],
          Temperature2: data['Temperature 2'],
          Battery2: data['Battery 2'],
          Humidity3: data['Humidity 3'],
          Temperature3: data['Temperature 3'],
          Battery3: data['Battery 3'],
        };
        console.log(resultData);

        await reff.collection('History').add(resultData);
      });

      lastResult = results[results.length - 1];
      await reff.update(lastResult);

      res.status(200).json(lastResult);
    })
    .on('error', (error) => {
      res.status(500).send('Error processing CSV file');
    });

  // Success
  // res.status(200).send('Success');
});

// Start server
Tambanng.listen(PORT);
console.log(`Server listening at ${PORT}`);
