import path from "path";
import dotenv from "dotenv";

dotenv.config()

class BaseConfig {
    // readonly routsPrefix = "/api/v1/";
    accessLogFile = __dirname + "\\..\\..\\logs\\accessLog.log";
    errorLogFile = path.resolve(__dirname, "..", "..", "logs", "errorLog.log");
    productImagesPrefix = path.resolve(__dirname, "..", "..", "assets", "images")
    tokenSecretKey = process.env.TOKEN_SECRET_KEY;
    jwtSecret = process.env.JWT_SECRET || process.env.TOKEN_SECRET_KEY || "very-secret-dev-key";
    DB_PORT = 5432;

    readonly s3_config = {
        key: process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        region: "eu-central-1",
        bucket_name: "class63bucket",
        image_folder: "myFolder",
        imagesVacationFolder: "vacationImages"

    }
}

class DevConfig extends BaseConfig {
    DB_USER = "app";
    DB_PASSWORD = "app123";
    DB_HOST = "localhost";
    DB_NAME = "appdb";

    DB_URL = `postgres://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`
    port = 3030;
}

class ProdConfig extends BaseConfig {
    DB_FILE = __dirname + "\\..\\..\\prod_sqlite.db";
    port = 3033;

    DB_USER = process.env.DB_USER;
    DB_PASSWORD = process.env.DB_PASSWORD;
    DB_HOST = process.env.DB_HOST;
    DB_NAME = process.env.DB_NAME;

    DB_URL = `postgres://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`;
}

export const appConfig = Number(global.process.env.IS_PROD) === 1 ? new ProdConfig() : new DevConfig();