const router = require("express").Router();
const adminUserController = require("../controllers/adminUser.controller");

router.get("/users", adminUserController.getAllUsers);
router.get("/user/:id", adminUserController.getUserById);
router.get("/suspended-users", adminUserController.suspendedUsers);
router.put("/suspend-user/:id", adminUserController.suspendUser);
router.put("/block-user/:id", adminUserController.blockUser);
router.delete("/delete-user/:id", adminUserController.deleteUserById);

module.exports = router;
