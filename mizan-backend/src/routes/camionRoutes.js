const express = require("express");

const router = express.Router();

const camionController = require("../controllers/camionController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get(
    "/",
    camionController.getAllCamions
);
router.post(
    "/ocr",
    camionController.createOrGetCamionFromOCR
);
router.get(
    "/:id",
    camionController.getCamionById
);

router.post(
    "/",
    camionController.createCamion
);

router.put(
    "/:id",
    camionController.updateCamion
);

router.delete(
    "/:id",
    camionController.deleteCamion
);

module.exports = router;