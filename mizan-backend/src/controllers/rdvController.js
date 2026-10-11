const { Op } = require("sequelize");
const { RendezVous, Chauffeur, Camion } = require("../models");


// ============================================================
// CREER UN RENDEZ-VOUS
// ============================================================

const creerRendezVous = async (req, res) => {
    try {
        const {
            camion_id,
            chauffeur_id,
            date_rdv,
            creneau_horaire,
        } = req.body;

        if (
            !camion_id ||
            !chauffeur_id ||
            !date_rdv ||
            !creneau_horaire
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "camion_id, chauffeur_id, date_rdv et creneau_horaire sont obligatoires",
            });
        }

        const chauffeur = await Chauffeur.findByPk(chauffeur_id);

        if (!chauffeur) {
            return res.status(404).json({
                success: false,
                message: "Chauffeur introuvable",
            });
        }

        if (!chauffeur.actif) {
            return res.status(400).json({
                success: false,
                message: "Ce chauffeur est inactif",
            });
        }

        const camion = await Camion.findByPk(camion_id);

        if (!camion) {
            return res.status(404).json({
                success: false,
                message: "Camion introuvable",
            });
        }

        const rendezVousExistant = await RendezVous.findOne({
            where: {
                camion_id,
                date_rdv,
                creneau_horaire,
                statut: {
                    [Op.in]: [
                        "PROGRAMME",
                        "EN_RETARD",
                    ],
                },
            },
        });

        if (rendezVousExistant) {
            return res.status(409).json({
                success: false,
                message:
                    "Ce camion possède déjà un rendez-vous pour ce créneau",
            });
        }

        const rendezVous = await RendezVous.create({
            camion_id,
            chauffeur_id,
            date_rdv,
            creneau_horaire,
            statut: "PROGRAMME",
        });

        const rendezVousComplet = await RendezVous.findByPk(
            rendezVous.id,
            {
                include: [
                    {
                        model: Chauffeur,
                        as: "chauffeur",
                        attributes: [
                            "id",
                            "nom",
                            "prenom",
                            "cin",
                            "code_qr",
                        ],
                    },
                    {
                        model: Camion,
                        as: "camion",
                        attributes: [
                            "id",
                            "immatriculation",
                            "immatriculation_remorque",
                            "marque",
                            "societe_transport",
                        ],
                    },
                ],
            }
        );

        return res.status(201).json({
            success: true,
            message: "Rendez-vous créé avec succès",
            rendezVous: rendezVousComplet,
        });
    } catch (error) {
        console.error(
            "[RDV] Erreur création rendez-vous :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la création du rendez-vous",
            error: error.message,
        });
    }
};


// ============================================================
// RECUPERER TOUS LES RENDEZ-VOUS
// ============================================================

const getTousLesRendezVous = async (req, res) => {
    try {
        const rendezVous = await RendezVous.findAll({
            include: [
                {
                    model: Chauffeur,
                    as: "chauffeur",
                    attributes: [
                        "id",
                        "nom",
                        "prenom",
                        "cin",
                        "code_qr",
                    ],
                },
                {
                    model: Camion,
                    as: "camion",
                    attributes: [
                        "id",
                        "immatriculation",
                        "immatriculation_remorque",
                        "marque",
                        "societe_transport",
                    ],
                },
            ],
            order: [
                ["date_rdv", "ASC"],
                ["creneau_horaire", "ASC"],
            ],
        });

        return res.status(200).json({
            success: true,
            count: rendezVous.length,
            rendezVous,
        });
    } catch (error) {
        console.error(
            "[RDV] Erreur récupération rendez-vous :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur serveur lors de la récupération des rendez-vous",
            error: error.message,
        });
    }
};


// ============================================================
// RECUPERER UN RENDEZ-VOUS PAR ID
// ============================================================

const getRendezVousParId = async (req, res) => {
    try {
        const { id } = req.params;

        const rendezVous = await RendezVous.findByPk(id, {
            include: [
                {
                    model: Chauffeur,
                    as: "chauffeur",
                    attributes: [
                        "id",
                        "nom",
                        "prenom",
                        "cin",
                        "code_qr",
                    ],
                },
                {
                    model: Camion,
                    as: "camion",
                    attributes: [
                        "id",
                        "immatriculation",
                        "immatriculation_remorque",
                        "marque",
                        "societe_transport",
                    ],
                },
            ],
        });

        if (!rendezVous) {
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable",
            });
        }

        return res.status(200).json({
            success: true,
            rendezVous,
        });
    } catch (error) {
        console.error(
            "[RDV] Erreur récupération rendez-vous :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
        });
    }
};


// ============================================================
// RECUPERER LES RENDEZ-VOUS D'UN CHAUFFEUR
// ============================================================

const getRendezVousParChauffeur = async (req, res) => {
    try {
        const { chauffeurId } = req.params;

        const rendezVous = await RendezVous.findAll({
            where: {
                chauffeur_id: chauffeurId,
            },
            include: [
                {
                    model: Chauffeur,
                    as: "chauffeur",
                    attributes: [
                        "id",
                        "nom",
                        "prenom",
                        "cin",
                    ],
                },
                {
                    model: Camion,
                    as: "camion",
                    attributes: [
                        "id",
                        "immatriculation",
                        "immatriculation_remorque",
                        "marque",
                        "societe_transport",
                    ],
                },
            ],
            order: [
                ["date_rdv", "DESC"],
                ["date_creation", "DESC"],
            ],
        });

        return res.status(200).json({
            success: true,
            count: rendezVous.length,
            rendezVous,
        });
    } catch (error) {
        console.error(
            "[RDV] Erreur rendez-vous chauffeur :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
        });
    }
};


// ============================================================
// ANNULER UN RENDEZ-VOUS
// ============================================================

const annulerRendezVous = async (req, res) => {
    try {
        const { id } = req.params;

        const rendezVous = await RendezVous.findByPk(id);

        if (!rendezVous) {
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable",
            });
        }



        rendezVous.statut = "ANNULE";

        await rendezVous.save();

        return res.status(200).json({
            success: true,
            message: "Rendez-vous annulé avec succès",
            rendezVous,
        });
    } catch (error) {
        console.error(
            "[RDV] Erreur annulation rendez-vous :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
        });
    }
};


module.exports = {
    creerRendezVous,
    getTousLesRendezVous,
    getRendezVousParId,
    getRendezVousParChauffeur,
    annulerRendezVous,
};