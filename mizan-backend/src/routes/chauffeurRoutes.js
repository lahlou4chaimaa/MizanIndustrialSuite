const express = require("express");

const router = express.Router();

const chauffeurController = require("../controllers/chauffeurController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../../config/upload");

router.use(authMiddleware);

/*
 * IMPORTANT :
 * Les routes spécifiques doivent être placées avant /:id.
 */

router.get(
    "/qr/:code_qr",
    chauffeurController.getChauffeurByQr
);

router.post(
    "/enregistrer-avec-qr",
    chauffeurController.enregistrerAvecQrScanne
);

router.post(
    "/:id/photo-reference",
    upload.single("photo"),
    chauffeurController.uploaderPhotoReference
);

router.get(
    "/",
    chauffeurController.getAllChauffeurs
);

router.get(
    "/:id",
    chauffeurController.getChauffeurById
);

router.post(
    "/",
    chauffeurController.createChauffeur
);

router.put(
    "/:id",
    chauffeurController.updateChauffeur
);

router.delete(
    "/:id",
    chauffeurController.deleteChauffeur
);

module.exports = router;