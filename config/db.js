const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config(); // Charge les variables d'environnement
const app = express();
app.use(cors());
app.use(express.json());
const connectDB = async () => {
   mongoose.set("strictQuery", false);
   mongoose.connect(process.env.MONGO_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
   })
   .then(() => {
     console.log("Connected to MongoDB");
   
     // Listen on port 80 for HTTP server
    const PORT = process.env.PORT || 80;
    app.listen(PORT, () => {
      console.log(`Server started at port ${PORT}`);
     });
   
    
   })
   .catch((error) => {
     console.log("MongoDB connection error:", error);
   });
};

module.exports = connectDB;
