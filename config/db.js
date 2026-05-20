// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); // If comes error server will stop 
    }
};

export default connectDB;




// config/db.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config();

// const connectDB = async () => {
//     const mongoURI = process.env.MONGODB_URI?.trim();

//     if (!mongoURI) {
//         console.error("Missing MONGODB_URI in environment. Set MONGODB_URI in your .env file.");
//         process.exit(1);
//     }

//     try {
//         await mongoose.connect(mongoURI, {
//             connectTimeoutMS: 10000,
//             serverSelectionTimeoutMS: 10000
//         });
//         console.log("Connected to MongoDB successfully");
//     } catch (error) {
//         console.error("MongoDB connection failed:", error.message);
//         console.error("Verify Atlas Network Access allows your current IP address, or add 0.0.0.0/0 for development.");
//         process.exit(1); // If DB connection fails, stop the server so issues are fixed first
//     }
// };

// export default connectDB;