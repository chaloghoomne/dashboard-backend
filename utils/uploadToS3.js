const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  Bucket: process.env.AWS_BUCKET_NAME,
});

const uploadToS3 = async (file) => {
  const fileParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
  };
  return new Promise((resolve, reject) => {
    s3.upload(fileParams, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.Location);
      }
    });
  });
};

module.exports = uploadToS3;
