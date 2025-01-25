

function genRandomId(prefix) {
  try {
    // Get the current timestamp
    const timestamp = Date.now().toString();

    // Construct the user ID with the provided prefix followed by timestamp
    const userId = `${prefix}${timestamp}`;

    return userId;
  } catch (error) {
    console.log(error);
    throw new Error("Error generating user id");
  }
}

module.exports = genRandomId;
