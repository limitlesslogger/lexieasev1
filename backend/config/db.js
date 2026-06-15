import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (typeof mongoUri !== "string" || mongoUri.trim().length === 0) {
    throw new Error(
      "Missing MongoDB URI. Set MONGO_URI (or MONGODB_URI) in backend/.env"
    );
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

export default connectDB;
