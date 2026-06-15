import express from "express"; //creates backend server
import cors from "cors"; //allows communication between frontend and backend
import cookieParser from "cookie-parser"; //lets backend read cookies - cookie based auth

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import letterRoutes from "./routes/letterRoutes.js";
import sentenceRoutes from "./routes/sentenceRoutes.js";
import wordRoutes from "./routes/wordRoutes.js";
import twoLetterRoutes from "./routes/twoLetterRoutes.js";
import syllableRoutes from "./routes/syllableRoutes.js";
import trainingDocumentRoutes from "./routes/trainingDocumentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import therapistRoutes from "./routes/therapistRoutes.js";
import guardianRoutes from "./routes/guardianRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

//Health check endpoint
app.get("/", (req, res) => {
  res.send("LexiEase backend running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/sentences", sentenceRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/twoletterwords", twoLetterRoutes);
app.use("/api/syllables", syllableRoutes);
app.use("/api/training-documents", trainingDocumentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api/guardian", guardianRoutes);
export default app;
