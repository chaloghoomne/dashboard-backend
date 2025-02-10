const axios = require("axios");

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || "sg"; // Example: "sg" for Singapore

const BASE_URL = `https://${BUNNY_STORAGE_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/`;

async function uploadToBunny(file) {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = BASE_URL + fileName;

    const response = await axios.put(filePath, file.buffer, {
      headers: {
        "AccessKey": BUNNY_ACCESS_KEY,
        "Content-Type": file.mimetype,
      },
    });

    if (response.status === 201) {
      return `https://${BUNNY_STORAGE_REGION}.b-cdn.net/${fileName}`; // BunnyCDN URL
    } else {
      throw new Error("Failed to upload to BunnyCDN");
    }
  } catch (error) {
    console.error("BunnyCDN Upload Error:", error.message);
    throw error;
  }
}

module.exports = uploadToBunny;
