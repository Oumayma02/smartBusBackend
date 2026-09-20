const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './.env' });

const app = require('./app');
const createDefaultSuperAdmin = require('./config/defaultAdmin');

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  createDefaultSuperAdmin();

  const PORT = process.env.PORT || 80;

  app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
