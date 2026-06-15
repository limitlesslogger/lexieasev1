import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

try {
  // Connect MongoDB before accepting requests
  await connectDB();

  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
