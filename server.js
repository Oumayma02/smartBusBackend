const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './.env' });

const app = require('./app');
const createDefaultSuperAdmin = require('./config/defaultAdmin');

mongoose.set('strictQuery', false);

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/iptsdb';
    const port = Number(process.env.PORT) || 80;

    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');

    await createDefaultSuperAdmin();

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server started on port ${port}`);
    });

    server.on('error', (error) => {
      console.error('HTTP server error:', error);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('Application startup failed:', error);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  }
};

startServer();
