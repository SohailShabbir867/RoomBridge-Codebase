const express = require("express");
const router = express.Router();
const { subscribe } = require("../controllers/subscription.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/subscribe", protect, subscribe);

module.exports = router;
