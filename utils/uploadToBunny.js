const uploadToBunny = async (file, fileName) => {
  const storageZoneName = process.env.STORAGE_ZONE_NAME;
  const accessKey = process.env.BUNNY_API_KEY;
  const storageEndpoint = process.env.BUNNY_STORAGE_API;

  if (!storageZoneName || !accessKey) {
    throw new Error("Missing required Bunny.net credentials");
  }
  try {
    const fileExtension = fileName.split(".").pop();
    const uniqueFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    const uploadUrl = `https://${storageEndpoint}/${storageZoneName}/${uniqueFilename}`;

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: accessKey,
        "Content-Type": "application/octet-stream",
      },
      body: file,
    });

    console.log("response", response);
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return {
      success: true,
      cdnUrl: `${process.env.CDN_URL}/${uniqueFilename}`,
      url: uploadUrl,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error("Error uploading to Bunny.net:", error);
    throw error;
  }
};

module.exports = uploadToBunny;
