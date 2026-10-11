const express = require("express");

const router = express.Router();

const {
    creerPrestation,
    getPrestations,
    getPrestationById,
    getPrestationByQr,
    changerStatut,
    affecterPrestation,
    getPrestationsPDA,
    getPrestationsParAgent,
} = require("../controllers/prestationController");

// ============================================================
// CREATION
// POST /api/prestations
// ============================================================

router.post(
    "/",
    creerPrestation
);

// ============================================================
// LISTE COMPLETE
// GET /api/prestations
// ============================================================

router.get(
    "/",
    getPrestations
);

// ============================================================
// LISTE POUR PDA
// GET /api/prestations/pda
// ============================================================

router.get(
    "/pda",
    getPrestationsPDA
);

// ============================================================
// RECHERCHE PAR QR
// GET /api/prestations/qr/:qrCode
// ============================================================

router.get(
    "/qr/:qrCode",
    getPrestationByQr
);

// ============================================================
// AFFECTATION
// PATCH /api/prestations/:id/affectation
// ============================================================
router.get(
    "/agent/:agentId",
    getPrestationsParAgent
);
router.patch(
    "/:id/affectation",
    affecterPrestation
);

// ============================================================
// CHANGEMENT STATUT
// PATCH /api/prestations/:id/statut
// ============================================================

router.patch(
    "/:id/statut",
    changerStatut
);

// ============================================================
// PRESTATION PAR ID
// GET /api/prestations/:id
// ============================================================


router.get(
    "/:id",
    getPrestationById
);

module.exports = router;