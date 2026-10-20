const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './.env' });

const app = require('./app');
const createDefaultSuperAdmin = require('./config/defaultAdmin');

mongoose.set('strictQuery', false);

mongoose.connect('mongodb://mongo:27017/iptsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');

  await createDefaultSuperAdmin();

  const PORT = 80;
  app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exitCode = 1;
});
