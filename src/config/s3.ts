import { S3 } from "aws-sdk";

const {
  REGION = "",
  ACCESS_KEY_ID = "",
  SECRET_ACCESS_KEY = "",
  S3_BUCKET = "",
} = process.env;

const s3 = new S3({
  region: REGION,
  signatureVersion: "v4",
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});

export const getSignedUrl = async (fileKey: string, fileType: string) => {
  const uploadURL = await s3.getSignedUrlPromise("putObject", {
    Bucket: S3_BUCKET,
    Key: fileKey,
    Expires: 120,
    ContentType: fileType,
    ACL: "private",
  });

  return uploadURL;
};

export const getFileStream = async (fileKey: string) => {
  return s3
    .getObject({
      Key: fileKey,
      Bucket: S3_BUCKET,
    })
    .createReadStream();
};

export const fileExists = async (fileKey: string) => {
  try {
    const fileHead = await s3
      .headObject({
        Key: fileKey,
        Bucket: S3_BUCKET,
      })
      .promise();

    return true;
  } catch (e) {
    return false;
  }
};
