
const {
    PrestationAutorisation,
    Prestation,
    Camion,
    Chauffeur,
} = require("../models");

// ============================================================
// CRÉER UNE AUTORISATION
// ============================================================

const creerAutorisation = async (req, res) => {
    try {
        const {
            prestation_id,
            camion_id,
            chauffeur_id,
            type_autorisation,
            date_debut,
            date_fin,
            observations,
        } = req.body;

        // --------------------------------------------------------
        // VALIDATION DE BASE
        // --------------------------------------------------------

        if (!prestation_id) {
            return res.status(400).json({
                success: false,
                message: "prestation_id est obligatoire",
            });
        }

        if (!type_autorisation) {
            return res.status(400).json({
                success: false,
                message: "type_autorisation est obligatoire",
            });
        }

        const typesAutorises = [
            "CAMION",
            "CHAUFFEUR",
            "CAMION_CHAUFFEUR",
        ];

        if (!typesAutorises.includes(type_autorisation)) {
            return res.status(400).json({
                success: false,
                message:
                    "type_autorisation doit être CAMION, CHAUFFEUR ou CAMION_CHAUFFEUR",
            });
        }

        // --------------------------------------------------------
        // VALIDATION SELON LE TYPE
        // --------------------------------------------------------

        if (
            (type_autorisation === "CAMION" ||
                type_autorisation === "CAMION_CHAUFFEUR") &&
            !camion_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "camion_id est obligatoire pour cette autorisation",
            });
        }

        if (
            (type_autorisation === "CHAUFFEUR" ||
                type_autorisation === "CAMION_CHAUFFEUR") &&
            !chauffeur_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "chauffeur_id est obligatoire pour cette autorisation",
            });
        }

        // --------------------------------------------------------
        // VÉRIFIER LA PRESTATION
        // --------------------------------------------------------

        const prestation = await Prestation.findByPk(prestation_id);

        if (!prestation) {
            return res.status(404).json({
                success: false,
                message: "Prestation introuvable",
            });
        }

        // --------------------------------------------------------
        // VÉRIFIER LE CAMION
        // --------------------------------------------------------

        if (camion_id) {
            const camion = await Camion.findByPk(camion_id);

            if (!camion) {
                return res.status(404).json({
                    success: false,
                    message: "Camion introuvable",
                });
            }
        }

        // --------------------------------------------------------
        // VÉRIFIER LE CHAUFFEUR
        // --------------------------------------------------------

        if (chauffeur_id) {
            const chauffeur = await Chauffeur.findByPk(chauffeur_id);

            if (!chauffeur) {
                return res.status(404).json({
                    success: false,
                    message: "Chauffeur introuvable",
                });
            }
        }

        // --------------------------------------------------------
        // ÉVITER LES DOUBLONS ACTIFS
        // --------------------------------------------------------
        //
        // On vérifie uniquement une autorisation ACTIVE.
        //
        // Exemple :
        // CAMION 24 + PRESTATION 5 + CAMION
        // ne peut exister qu'une seule fois active.
        //
        // Mais :
        // CAMION
        // et
        // CAMION_CHAUFFEUR
        //
        // peuvent coexister car ce sont deux types
        // d'autorisation différents.
        // --------------------------------------------------------

        const conditionsDoublon = {
            prestation_id,
            type_autorisation,
            actif: true,
        };

        if (type_autorisation === "CAMION") {
            conditionsDoublon.camion_id = camion_id;
            conditionsDoublon.chauffeur_id = null;
        }

        if (type_autorisation === "CHAUFFEUR") {
            conditionsDoublon.camion_id = null;
            conditionsDoublon.chauffeur_id = chauffeur_id;
        }

        if (type_autorisation === "CAMION_CHAUFFEUR") {
            conditionsDoublon.camion_id = camion_id;
            conditionsDoublon.chauffeur_id = chauffeur_id;
        }

        const autorisationExistante =
            await PrestationAutorisation.findOne({
                where: conditionsDoublon,
            });

        if (autorisationExistante) {
            let message = "Cette autorisation existe déjà.";

            if (type_autorisation === "CAMION") {
                message =
                    "Ce camion est déjà autorisé pour cette prestation.";
            }

            if (type_autorisation === "CHAUFFEUR") {
                message =
                    "Ce chauffeur est déjà autorisé pour cette prestation.";
            }

            if (type_autorisation === "CAMION_CHAUFFEUR") {
                message =
                    "Ce camion et ce chauffeur sont déjà associés à cette prestation.";
            }

            return res.status(409).json({
                success: false,
                message,
                raison: "AUTORISATION_DEJA_EXISTANTE",
                autorisation: autorisationExistante,
            });
        }

        // --------------------------------------------------------
        // CRÉATION
        // --------------------------------------------------------

        const autorisation =
            await PrestationAutorisation.create({
                prestation_id,
                camion_id: camion_id || null,
                chauffeur_id: chauffeur_id || null,
                type_autorisation,
                actif: true,
                date_debut: date_debut || null,
                date_fin: date_fin || null,
                observations: observations || null,
            });

        // --------------------------------------------------------
        // RETOUR COMPLET
        // --------------------------------------------------------

        const autorisationComplete =
            await PrestationAutorisation.findByPk(
                autorisation.id,
                {
                    include: [
                        {
                            model: Prestation,
                            as: "prestation",
                        },
                        {
                            model: Camion,
                            as: "camion",
                        },
                        {
                            model: Chauffeur,
                            as: "chauffeur",
                        },
                    ],
                }
            );

        return res.status(201).json({
            success: true,
            message: "Autorisation créée avec succès",
            autorisation: autorisationComplete,
        });
    } catch (error) {
        console.error(
            "[PRESTATION AUTORISATION] Erreur création :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur serveur lors de la création de l'autorisation",
            error: error.message,
        });
    }
};

// ============================================================
// RÉCUPÉRER LES AUTORISATIONS
// ============================================================

const getAutorisations = async (req, res) => {
    try {
        const {
            prestation_id,
            camion_id,
            chauffeur_id,
            type_autorisation,
            actif,
        } = req.query;

        const where = {};

        if (prestation_id) {
            where.prestation_id = prestation_id;
        }

        if (camion_id) {
            where.camion_id = camion_id;
        }

        if (chauffeur_id) {
            where.chauffeur_id = chauffeur_id;
        }

        if (type_autorisation) {
            where.type_autorisation = type_autorisation;
        }

        if (actif !== undefined) {
            where.actif = actif === "true";
        }

        const autorisations =
            await PrestationAutorisation.findAll({
                where,
                include: [
                    {
                        model: Prestation,
                        as: "prestation",
                    },
                    {
                        model: Camion,
                        as: "camion",
                    },
                    {
                        model: Chauffeur,
                        as: "chauffeur",
                    },
                ],
                order: [["id", "DESC"]],
            });

        return res.status(200).json({
            success: true,
            count: autorisations.length,
            autorisations,
        });
    } catch (error) {
        console.error(
            "[PRESTATION AUTORISATION] Erreur récupération :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur serveur lors de la récupération des autorisations",
            error: error.message,
        });
    }
};

// ============================================================
// ACTIVER / DÉSACTIVER UNE AUTORISATION
// ============================================================

const changerEtatAutorisation = async (req, res) => {
    try {
        const { id } = req.params;
        const { actif } = req.body;

        if (actif === undefined) {
            return res.status(400).json({
                success: false,
                message: "Le champ actif est obligatoire",
            });
        }

        const autorisation =
            await PrestationAutorisation.findByPk(id);

        if (!autorisation) {
            return res.status(404).json({
                success: false,
                message: "Autorisation introuvable",
            });
        }

        autorisation.actif = Boolean(actif);

        await autorisation.save();

        return res.status(200).json({
            success: true,
            message: autorisation.actif
                ? "Autorisation activée"
                : "Autorisation désactivée",
            autorisation,
        });
    } catch (error) {
        console.error(
            "[PRESTATION AUTORISATION] Erreur changement état :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur serveur lors du changement d'état de l'autorisation",
            error: error.message,
        });
    }
};

// ============================================================
// VÉRIFIER L'AUTORISATION D'UN CAMION POUR UNE PRESTATION
// ============================================================

const {
    verifierAutorisationPrestation,
    trouverPrestationAutoriseeParCamion,
    validerPrestationPourCamion,
    validerAccesPrestation
} = require("./prestationAutorisationService");

const verifierAutorisation = async (req, res) => {
    try {
        const {
            prestation_id,
            camion_id,
        } = req.body;

        if (!prestation_id) {
            return res.status(400).json({
                success: false,
                message: "prestation_id est obligatoire",
            });
        }

        if (!camion_id) {
            return res.status(400).json({
                success: false,
                message: "camion_id est obligatoire",
            });
        }

        const resultat =
            await verifierAutorisationPrestation({
                prestationId: prestation_id,
                camionId: camion_id,
            });

        return res.status(200).json({
            success: true,
            prestation_id,
            camion_id,
            autorise: resultat.autorise,
            camion: resultat.camion,
        });
    } catch (error) {
        console.error(
            "[PRESTATION AUTORISATION] Erreur vérification :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur serveur lors de la vérification de l'autorisation",
            error: error.message,
        });
    }
};

const trouverPrestationParCamion = async (req, res) => {
    try {
        const { camion_id } = req.body;

        if (!camion_id) {
            return res.status(400).json({
                success: false,
                message: "camion_id est obligatoire",
            });
        }

        const resultat =
            await trouverPrestationAutoriseeParCamion(
                camion_id
            );

        if (!resultat) {
            return res.status(404).json({
                success: false,
                message:
                    "Aucune prestation active autorisée pour ce camion",
                camion_id,
            });
        }

        return res.status(200).json({
            success: true,
            camion_id,
            prestation: resultat,
        });
    } catch (error) {
        console.error(
            "[TROUVER PRESTATION] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la recherche de la prestation",
            error: error.message,
        });
    }
};


const validerPrestation = async (req, res) => {
    try {
        const {
            prestation_id,
            camion_id,
            chauffeur_id,
        } = req.body;

        // --------------------------------------------------------
        // VALIDATION DES DONNÉES
        // --------------------------------------------------------

        if (!prestation_id) {
            return res.status(400).json({
                success: false,
                message: "prestation_id est obligatoire",
                raison: "PRESTATION_ID_MANQUANT",
            });
        }

        if (!camion_id) {
            return res.status(400).json({
                success: false,
                message: "camion_id est obligatoire",
                raison: "CAMION_ID_MANQUANT",
            });
        }

        // --------------------------------------------------------
        // VALIDATION MÉTIER
        // --------------------------------------------------------

        const resultat = await validerAccesPrestation({
            prestationId: prestation_id,
            camionId: camion_id,
            chauffeurId: chauffeur_id || null,
        });

        // --------------------------------------------------------
        // REFUS
        // --------------------------------------------------------

        if (!resultat.valide) {
            return res.status(200).json({
                success: true,
                valide: false,
                raison: resultat.raison,

                prestation_id,
                camion_id,
                chauffeur_id:
                    chauffeur_id || null,

                statut:
                    resultat.statut || null,

                prestation:
                    resultat.prestation || null,

                camion:
                    resultat.camion || null,

                chauffeur:
                    resultat.chauffeur || null,

                marchandise:
                    resultat.marchandise || null,

                quantite_prevue:
                    resultat.quantite_prevue ?? null,

                quantite_realisee:
                    resultat.quantite_realisee ?? null,

                quantite_restante:
                    resultat.quantite_restante ?? null,
            });
        }

        // --------------------------------------------------------
        // AUTORISÉ
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,
            valide: true,
            raison: resultat.raison,

            prestation_id,
            camion_id,
            chauffeur_id:
                chauffeur_id || null,

            statut:
                resultat.statut,

            prestation:
                resultat.prestation,

            camion:
                resultat.camion,

            chauffeur:
                resultat.chauffeur,

            marchandise:
                resultat.marchandise,

            quantite_prevue:
                resultat.quantite_prevue,

            quantite_realisee:
                resultat.quantite_realisee,

            quantite_restante:
                resultat.quantite_restante,
        });
    } catch (error) {
        console.error(
            "[VALIDER PRESTATION] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la validation de la prestation",
            error: error.message,
        });
    }
};



// ============================================================
// EXPORT
// ============================================================

module.exports = {
    creerAutorisation,
    getAutorisations,
    changerEtatAutorisation,
    verifierAutorisation,
    trouverPrestationParCamion,
    validerPrestation,
    validerAccesPrestation,
};
