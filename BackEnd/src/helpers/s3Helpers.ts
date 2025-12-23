import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { appConfig } from "../utils/config";
import { Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";

function getS3Client() {
    const accessKeyId = appConfig.s3_config.key;
    const secretAccessKey = appConfig.s3_config.secret;
    const region = appConfig.s3_config.region;

    const s3Client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey
        },
    })
    return s3Client;
}

export async function uploadToS3Readable(fileStream: Readable, fileName: string): Promise<void> {
    const client = getS3Client();

    const upload = new Upload({
        client,
        params: {
            Bucket: appConfig.s3_config.bucket_name,
            Key: appConfig.s3_config.imagesVacationFolder + "/" + fileName,
            Body: fileStream
        }
    });

    try {
        await upload.done();
        console.log("Readable file successfully uploaded");
    } catch (error) {
        console.log("ERROR Readable file not uploaded", error);
    }
}

async function uploadToS3(filePath: string, fileName: string): Promise<void> {

    const bucket = appConfig.s3_config.bucket_name;
    const s3Client = getS3Client()

    const fileStream = fs.createReadStream(filePath);

    const uploadParams = {
        Bucket: bucket,
        Key: appConfig.s3_config.image_folder + "/" + fileName,
        Body: fileStream
    }

    try {
        const command = new PutObjectCommand(uploadParams);
        const result = await s3Client.send(command);
        console.log(`File successfully uploaded to ${bucket}. name: ${fileName}. result: \n${result}`);

    } catch (error) {
        console.log("Error during upload to S3. more info:", error);
    }

}

async function deleteFromS3(objectName: string) {

    const s3Client = getS3Client()
    const bucket = appConfig.s3_config.bucket_name;

    const deleteParams = {
        Bucket: bucket,
        // Key: objectName
        Key: appConfig.s3_config.image_folder + "/" + objectName
    }

    try {
        const command = new DeleteObjectCommand(deleteParams);
        const res = await s3Client.send(command);
        console.log(`Object ${objectName} successfully deleted from S3 ${bucket} `);
    } catch (error) {
        console.log("Error during deleting from S3: ", error);
    }
}