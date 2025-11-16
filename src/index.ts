import dotenv from "dotenv";
dotenv.config(); // <- loads .env into process.env

import express from "express";
import cors from "cors";
import fileRoutes from "./routes/files";
import { authenticate } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.send("OK"));

app.use("/api/files", authenticate, fileRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
