const express = require("express");

const router = express.Router();

const multer = require("multer");

const peseeController = require("../controllers/peseeController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = multer({
    storage: multer.memoryStorage(),
});

router.use(authMiddleware);

/*
 * Les routes spécifiques doivent être avant /:id.
 */

router.get(
    "/en-cours/camion/:immatriculation",
    peseeController.getPeseeEnCoursParCamion
);

router.get(
    "/",
    peseeController.getAll
);

router.post(
    "/entree",
    upload.none(),
    peseeController.createEntree
);

router.get(
    "/:id",
    peseeController.getById
);

router.post(
    "/:id/sortie",
    peseeController.createSortie
);

module.exports = router;