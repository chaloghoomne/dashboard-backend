const travelAgentController = require("../controllers/travelAgent.controller");
const router = require("express").Router();

router.post("/add-travel-agent", travelAgentController.addTravelAgent);
router.put("/edit-travel-agent/:id", travelAgentController.editTravelAgent);
router.get("/travel-agents", travelAgentController.getTravelAgents);
router.get("/travel-agent/:id", travelAgentController.getTravelAgentById);
router.delete("/travel-agent/:id", travelAgentController.deleteTravelAgent);

module.exports = router;
