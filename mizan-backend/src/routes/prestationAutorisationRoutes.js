const express = require("express");

const router = express.Router();

const {
    creerAutorisation,
    getAutorisations,
    changerEtatAutorisation,
    verifierAutorisation,
    trouverPrestationParCamion,
    validerPrestation,
} = require("../controllers/prestationAutorisationController");

// ============================================================
// AUTORISATIONS PRESTATION
// ============================================================

// Créer une autorisation
router.post("/", creerAutorisation);

// Récupérer les autorisations
// Exemples :
// GET /api/prestation-autorisations
// GET /api/prestation-autorisations?prestation_id=5
// GET /api/prestation-autorisations?camion_id=24
// GET /api/prestation-autorisations?chauffeur_id=11
router.get("/", getAutorisations);

router.post(
    "/verifier",
    verifierAutorisation
);

router.post(
    "/trouver-prestation",
    trouverPrestationParCamion
);

router.post(
    "/valider",
    validerPrestation
);
// Activer / désactiver
router.patch("/:id/etat", changerEtatAutorisation);


module.exports = router;