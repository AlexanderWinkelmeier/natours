const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Fehler aus synchronem Code außerhalb von Express abfangen

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🎇 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// console.log(app.get('env')); /* gibt die von Express gesetzte Umgebungsvariable aus */
// console.log(process.env; /* gibt alle Prozessvariablen aus und die, die in config.env definiert wurden */

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// mit der Atlas-Datenbank von Mongodb verbinden

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  // alternativ mit der lokalen Datenbank verbinden (mongod.exe in der shell nicht vergessen!)
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Fehler aus asynchronem Code außerhalb von Express abfangen

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 🎇 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    /* schließt zuerst den Server und dann die App */
    process.exit(1);
  });
});

// console.log(x); /* wirft uncaught exception - auch wenn dieser Fehler irgendwo anders in der App vorkommt*/
