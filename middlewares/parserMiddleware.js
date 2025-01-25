function parseToJson(req, res, next) {
  try {
    if (req.method === "GET" || req.is("multipart/form-data")) {
      return next();
    }

    try {
      if (req.body) {
        let parsedData = req.body;

        while (typeof parsedData === "string") {
          try {
            parsedData = JSON.parse(parsedData);
          } catch (error) {
            break;
          }
        }

        if (typeof parsedData === "object" && parsedData !== null) {
          req.body = parsedData;
          console.log("Parsed Data: ", req.body);
          return next();
        } else {
          throw new Error("Parsed data is not a valid object.");
        }
      } else {
        return next();
      }
    } catch (error) {
      return res.status(400).json({
        message: "Failed to parse request data",
        success: false,
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = parseToJson;
