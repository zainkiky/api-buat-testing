const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

var corsOptions = {
  origin: `${HOST}:${PORT}`,
};

app.use(cors(corsOptions));

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello');
});

const { db } = require('./firebase');
db.settings({ ignoreUndefinedProperties: true });

app.post('/Tambang/periodic/:id', async (req, res) => {
  //Save data to database
  await db.collection('Tambang').doc(req.params.id).set(req.body);

  //Send response
  res.status(200).send('Success!');
});

app.post('/Tambang/:id', async (req, res) => {
  //Save data to database
  await db.collection('Tambang').doc(req.params.id).update(req.body);

  //Send response
  res.status(200).send('Success!');
});

// Start server
app.listen(PORT);
console.log(`Server listening at ${PORT}`);
