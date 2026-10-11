const express = require("express");

const router = express.Router();

const {
    creerRendezVous,
    getTousLesRendezVous,
    getRendezVousParId,
    getRendezVousParChauffeur,
    annulerRendezVous,
} = require("../controllers/rdvController");


// Créer un rendez-vous
router.post("/", creerRendezVous);

// Récupérer tous les rendez-vous
router.get("/", getTousLesRendezVous);

// Récupérer les rendez-vous d'un chauffeur
router.get(
    "/chauffeur/:chauffeurId",
    getRendezVousParChauffeur
);

// Récupérer un rendez-vous par son ID
router.get("/:id", getRendezVousParId);

// Annuler un rendez-vous
router.put("/:id/annuler", annulerRendezVous);


module.exports = router;