import express from "express"; //creates backend server
import cors from "cors"; //allows communication between frontend and backend
import cookieParser from "cookie-parser"; //lets backend read cookies - cookie based auth

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import relationshipRoutes from "./routes/relationshipRoutes.js";
import letterRoutes from "./routes/letterRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
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

export default app;
