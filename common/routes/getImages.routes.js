const getCountriesImage = require("../controllers/image.controller");
const router = require("express").Router();

router.post("/country-image", getCountriesImage.CountriesImage)

module.exports = router;