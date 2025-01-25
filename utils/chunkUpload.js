const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  Bucket: process.env.AWS_BUCKET_NAME,
});
const path = require("path");

const startMultipartUpload = async (file) => {
  const filename = `${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    ContentType: file.mimetype,
  };

  try {
    const multipartUpload = await s3.createMultipartUpload(params).promise();

    const uploadPartSize = 5 * 1024 * 1024; // 1MB parts
    const uploadPromises = [];

    for (let start = 0; start < file.buffer.length; start += uploadPartSize) {
      const end = Math.min(start + uploadPartSize, file.buffer.length);
      const partParams = {
        Body: file.buffer.slice(start, end),
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename,
        PartNumber: Math.floor(start / uploadPartSize) + 1,
        UploadId: multipartUpload.UploadId,
      };

      uploadPromises.push(
        s3
          .uploadPart(partParams)
          .promise()
          .then((result) => ({
            ETag: result.ETag,
            PartNumber: partParams.PartNumber,
          }))
      );
    }

    const uploadResults = await Promise.all(uploadPromises);

    const completeParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
      MultipartUpload: {
        Parts: uploadResults,
      },
      UploadId: multipartUpload.UploadId,
    };

    await s3.completeMultipartUpload(completeParams).promise();

    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
  } catch (error) {
    console.error("Error in multipart upload:", error);
    throw error;
  }
};

module.exports = startMultipartUpload;
