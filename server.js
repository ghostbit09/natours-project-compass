const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Manejo de promesas rechazadas
process.on('unhandledRejection', err => {
  console.log('Unhandled rejection! Shutting down...');
  console.log(err.name, err.message);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//Manejo de excepciones no controladas
process.on('uncaughtException', err => {
  console.log('Uncaught rejection! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
