import fs from "fs";
import { appConfig } from "../utils/config";

export function logIt(message: string, isError: boolean = false): void {
  const now = new Date().toISOString();
  const line = `[${now}] ${message}\n`;

  const filePath = isError
    ? appConfig.errorLogFile
    : appConfig.accessLogFile;

  try {
    fs.appendFile(filePath, line, (err) => {
      if (err) {
        console.error("Failed to write log file:", err);
      }
    });
  } catch (err) {
    console.error("Unexpected log write error:", err);
  }

  if (isError) {
    console.error(line);
  } else {
    console.log(line);
  }
}