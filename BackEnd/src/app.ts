import express from "express";
import cors from "cors";
import path from "path";
import { appConfig } from "./utils/config";
import { isDBup } from "./helpers/generalHelpers";
import { vacationRouter } from "./Controllers/vacationController";
import { userRouter } from "./Controllers/userController";
import errorHandler from "./middlewares/errorsHandler";
import fs from "fs";

async function bootstrap() {
  const dbOk = await isDBup();
  if (!dbOk) process.exit(1);

  console.log("DB is working");

  const server = express();

  // CORS
  server.use(
    cors({
      origin: [
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      credentials: true,
    })
  );

  const imagesDir = path.join(process.cwd(), "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  server.use(express.json());

  server.use("/api", userRouter);
  server.use("/api", vacationRouter);

  server.use("/images", express.static(imagesDir));

  // Test route
  server.get("/ping", (_req, res) => {
    console.log("GET /ping hit");
    res.send("pong");
  });

  server.use(errorHandler);

  server.listen(appConfig.port, () => {
    console.log(`Express server started.\nhttp://localhost:${appConfig.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error during server startup", err);
  process.exit(1);
});