const {
    Prestation,
    PrestationAutorisation,
    Camion,
    Chauffeur,
    Marchandise,
} = require("../models");

const { Op } = require("sequelize");


// ============================================================
// STATUTS BLOQUÉS
// ============================================================

const STATUTS_BLOQUES = [
    "TERMINEE",
    "ANNULEE",
    "CLOTUREE",
];


// ============================================================
// UTILITAIRE
// ============================================================

const getMaintenant = () => new Date();


// ============================================================
// UTILITAIRE - NORMALISER UN STATUT
// ============================================================

const normaliserStatut = (statut) => {
    return String(statut || "")
        .trim()
        .toUpperCase();
};


// ============================================================
// VÉRIFIER QU'UNE AUTORISATION EST ACTIVE
// ============================================================
//
// RÈGLE MÉTIER
//
// CAMION
// → le camion suffit
// → le chauffeur n'est PAS contrôlé
//
// CAMION_CHAUFFEUR
// → le camion doit correspondre
// → si un chauffeur est fourni, il doit être compatible
// → chauffeur_id NULL = autorisation générique pour le camion
//
// ============================================================

const verifierCamionAutorise = async (
    prestationId,
    camionId,
    chauffeurId = null
) => {

    if (!prestationId || !camionId) {
        return false;
    }

    const maintenant = getMaintenant();

    // --------------------------------------------------------
    // Recherche des autorisations du camion
    // --------------------------------------------------------

    const autorisations =
        await PrestationAutorisation.findAll({

            where: {

                prestation_id:
                    prestationId,

                camion_id:
                    camionId,

                actif:
                    true,

                type_autorisation: {
                    [Op.in]: [
                        "CAMION",
                        "CAMION_CHAUFFEUR",
                    ],
                },

                [Op.and]: [

                    // ----------------------------------------
                    // DATE DE DÉBUT
                    // ----------------------------------------

                    {
                        [Op.or]: [

                            {
                                date_debut:
                                    null,
                            },

                            {
                                date_debut: {
                                    [Op.lte]:
                                        maintenant,
                                },
                            },

                        ],
                    },

                    // ----------------------------------------
                    // DATE DE FIN
                    // ----------------------------------------

                    {
                        [Op.or]: [

                            {
                                date_fin:
                                    null,
                            },

                            {
                                date_fin: {
                                    [Op.gte]:
                                        maintenant,
                                },
                            },

                        ],
                    },

                ],
            },

            order: [
                ["id", "DESC"],
            ],

        });


    // --------------------------------------------------------
    // Aucune autorisation
    // --------------------------------------------------------

    if (!autorisations.length) {

        console.log(
            `[AUTORISATION] Aucune autorisation active pour prestation ${prestationId} / camion ${camionId}`
        );

        return false;
    }


    // --------------------------------------------------------
    // Vérification des types
    // --------------------------------------------------------

    for (
        const autorisation
        of autorisations
    ) {

        const type =
            normaliserStatut(
                autorisation.type_autorisation
            );


        // ====================================================
        // AUTORISATION CAMION
        // ====================================================
        //
        // Le chauffeur n'a aucune importance ici.
        //
        // Exemple :
        //
        // CAMION 62
        // chauffeur 2 dans autorisation
        //
        // Ticket :
        // camion 62
        // chauffeur 11
        //
        // => AUTORISÉ
        //
        // ====================================================

        if (
            type === "CAMION"
        ) {

            console.log(
                `[AUTORISATION] CAMION autorisé | prestation=${prestationId} | camion=${camionId}`
            );

            return true;
        }


        // ====================================================
        // AUTORISATION CAMION + CHAUFFEUR
        // ====================================================

        if (
            type === "CAMION_CHAUFFEUR"
        ) {

            // -----------------------------------------------
            // Aucun chauffeur fourni
            // -----------------------------------------------
            //
            // On accepte une autorisation générique
            // chauffeur_id NULL.
            //
            // -----------------------------------------------

            if (!chauffeurId) {

                if (
                    autorisation.chauffeur_id === null
                ) {

                    console.log(
                        `[AUTORISATION] CAMION_CHAUFFEUR générique autorisé | prestation=${prestationId} | camion=${camionId}`
                    );

                    return true;
                }

                continue;
            }


            // -----------------------------------------------
            // Autorisation générique
            // -----------------------------------------------

            if (
                autorisation.chauffeur_id === null
            ) {

                console.log(
                    `[AUTORISATION] CAMION_CHAUFFEUR générique compatible | prestation=${prestationId} | camion=${camionId} | chauffeur=${chauffeurId}`
                );

                return true;
            }


            // -----------------------------------------------
            // Chauffeur correspondant
            // -----------------------------------------------

            if (
                Number(
                    autorisation.chauffeur_id
                ) ===
                Number(
                    chauffeurId
                )
            ) {

                console.log(
                    `[AUTORISATION] CAMION_CHAUFFEUR compatible | prestation=${prestationId} | camion=${camionId} | chauffeur=${chauffeurId}`
                );

                return true;
            }

        }

    }


    console.log(
        `[AUTORISATION] Camion ${camionId} non compatible avec prestation ${prestationId}`
    );

    return false;
};


// ============================================================
// VÉRIFIER UNE PRESTATION PRÉCISE POUR UN CAMION
// ============================================================

const verifierAutorisationPrestation = async ({
    prestationId,
    camionId,
    chauffeurId = null,
}) => {

    // --------------------------------------------------------
    // PRESTATION ID
    // --------------------------------------------------------

    if (!prestationId) {

        return {
            autorise: false,
            raison: "PRESTATION_ID_MANQUANT",
            prestation: false,
            camion: false,
        };
    }


    // --------------------------------------------------------
    // CAMION ID
    // --------------------------------------------------------

    if (!camionId) {

        return {
            autorise: false,
            raison: "CAMION_ID_MANQUANT",
            prestation: false,
            camion: false,
        };
    }


    // --------------------------------------------------------
    // PRESTATION
    // --------------------------------------------------------

    const prestation =
        await Prestation.findByPk(
            prestationId
        );


    if (!prestation) {

        return {
            autorise: false,
            raison: "PRESTATION_INTROUVABLE",
            prestation: false,
            camion: false,
        };
    }


    // --------------------------------------------------------
    // STATUT
    // --------------------------------------------------------

    const statut =
        normaliserStatut(
            prestation.statut
        );


    if (
        STATUTS_BLOQUES.includes(
            statut
        )
    ) {

        return {
            autorise: false,

            raison:
                "PRESTATION_NON_ACTIVE",

            prestation: false,

            camion: false,

            statut:
                prestation.statut,
        };
    }


    // --------------------------------------------------------
    // AUTORISATION
    // --------------------------------------------------------
    //
    // IMPORTANT :
    //
    // On ne fait PAS :
    //
    // prestation.camion_id === camionId
    //
    // car une prestation peut avoir plusieurs camions.
    //
    // La vraie autorisation est dans :
    //
    // prestation_autorisations
    //
    // --------------------------------------------------------

    const camionAutorise =
        await verifierCamionAutorise(
            prestationId,
            camionId,
            chauffeurId
        );


    if (!camionAutorise) {

        return {
            autorise: false,

            raison:
                "CAMION_NON_AUTORISE",

            prestation: true,

            camion: false,

            statut:
                prestation.statut,
        };
    }


    // --------------------------------------------------------
    // AUTORISÉ
    // --------------------------------------------------------

    return {

        autorise: true,

        raison:
            "AUTORISE",

        prestation: true,

        camion: true,

        statut:
            prestation.statut,

    };
};


// ============================================================
// TROUVER TOUTES LES PRESTATIONS AUTORISÉES POUR UN CAMION
// ============================================================

const trouverPrestationsAutoriseesParCamion = async (
    camionId,
    chauffeurId = null
) => {

    if (!camionId) {

        console.log(
            "[AUTORISATION] camionId manquant"
        );

        return [];
    }


    const maintenant =
        getMaintenant();


    // ========================================================
    // RECHERCHE DES AUTORISATIONS
    // ========================================================

    const autorisations =
        await PrestationAutorisation.findAll({

            where: {

                camion_id:
                    camionId,

                actif:
                    true,

                type_autorisation: {
                    [Op.in]: [
                        "CAMION",
                        "CAMION_CHAUFFEUR",
                    ],
                },

                [Op.and]: [

                    // ----------------------------------------
                    // DATE DE DÉBUT
                    // ----------------------------------------

                    {
                        [Op.or]: [

                            {
                                date_debut:
                                    null,
                            },

                            {
                                date_debut: {
                                    [Op.lte]:
                                        maintenant,
                                },
                            },

                        ],
                    },

                    // ----------------------------------------
                    // DATE DE FIN
                    // ----------------------------------------

                    {
                        [Op.or]: [

                            {
                                date_fin:
                                    null,
                            },

                            {
                                date_fin: {
                                    [Op.gte]:
                                        maintenant,
                                },
                            },

                        ],
                    },

                ],
            },

            include: [

                {
                    model:
                        Prestation,

                    as:
                        "prestation",

                    required:
                        true,

                    where: {

                        statut: {
                            [Op.notIn]:
                                STATUTS_BLOQUES,
                        },

                    },

                },

            ],

            order: [

                [
                    {
                        model:
                            Prestation,

                        as:
                            "prestation",
                    },

                    "priorite",

                    "DESC",
                ],

                [
                    {
                        model:
                            Prestation,

                        as:
                            "prestation",
                    },

                    "date_creation",

                    "DESC",
                ],

                [
                    "id",
                    "DESC",
                ],

            ],

        });


    // ========================================================
    // AUCUNE AUTORISATION
    // ========================================================

    if (!autorisations.length) {

        console.log(
            `[AUTORISATION] Aucune prestation active pour camion ${camionId}`
        );

        return [];
    }


    console.log(
        `[AUTORISATION] ${autorisations.length} autorisation(s) trouvée(s) pour camion ${camionId}`
    );


    // ========================================================
    // FILTRAGE CHAUFFEUR
    // ========================================================

    const autorisationsCompatibles =
        autorisations.filter(
            (autorisation) => {

                const type =
                    normaliserStatut(
                        autorisation.type_autorisation
                    );


                // ====================================================
                // CAMION
                // ====================================================
                //
                // IMPORTANT :
                //
                // Une autorisation CAMION ne dépend PAS du chauffeur.
                //
                // Même si :
                //
                // autorisation.chauffeur_id = 2
                //
                // et :
                //
                // ticket.chauffeur_id = 11
                //
                // le camion reste autorisé.
                //
                // ====================================================

                if (
                    type === "CAMION"
                ) {

                    console.log(
                        `[AUTORISATION] Compatible CAMION | prestation=${autorisation.prestation_id} | camion=${camionId}`
                    );

                    return true;
                }


                // ====================================================
                // CAMION_CHAUFFEUR
                // ====================================================

                if (
                    type ===
                    "CAMION_CHAUFFEUR"
                ) {

                    // -----------------------------------------------
                    // Aucun chauffeur dans le ticket
                    // -----------------------------------------------

                    if (!chauffeurId) {

                        // Autorisation générique
                        if (
                            autorisation.chauffeur_id ===
                            null
                        ) {

                            return true;
                        }

                        return true;
                    }


                    // -----------------------------------------------
                    // Autorisation générique
                    // -----------------------------------------------

                    if (
                        autorisation.chauffeur_id ===
                        null
                    ) {

                        return true;
                    }


                    // -----------------------------------------------
                    // Chauffeur correspondant
                    // -----------------------------------------------

                    return (
                        Number(
                            autorisation.chauffeur_id
                        ) ===
                        Number(
                            chauffeurId
                        )
                    );
                }


                return false;
            }
        );


    // ========================================================
    // AUCUNE AUTORISATION COMPATIBLE
    // ========================================================

    if (
        !autorisationsCompatibles.length
    ) {

        console.log(
            `[AUTORISATION] Aucune autorisation compatible pour camion ${camionId} / chauffeur ${chauffeurId || "non fourni"}`
        );

        return [];
    }


    // ========================================================
    // DÉDUPLICATION
    // ========================================================

    const prestationsMap =
        new Map();


    for (
        const autorisation
        of autorisationsCompatibles
    ) {

        const prestation =
            autorisation.prestation;


        if (!prestation) {
            continue;
        }


        // ----------------------------------------------------
        // Vérifier quantité
        // ----------------------------------------------------

        const prevue =
            prestation.quantite_prevue !== null &&
                prestation.quantite_prevue !== undefined
                ? Number(
                    prestation.quantite_prevue
                )
                : null;


        const realisee =
            prestation.quantite_realisee !== null &&
                prestation.quantite_realisee !== undefined
                ? Number(
                    prestation.quantite_realisee
                )
                : 0;


        let quantiteRestante =
            null;


        if (prevue !== null) {

            quantiteRestante =
                Math.max(
                    0,
                    prevue - realisee
                );


            // ------------------------------------------------
            // Prestation épuisée
            // ------------------------------------------------

            if (
                quantiteRestante <= 0
            ) {

                console.log(
                    `[AUTORISATION] Prestation ${prestation.id} ignorée : quantité épuisée`
                );

                continue;
            }
        }


        // ----------------------------------------------------
        // Déduplication
        // ----------------------------------------------------

        if (
            prestationsMap.has(
                prestation.id
            )
        ) {

            continue;
        }


        // ----------------------------------------------------
        // Ajouter la prestation
        // ----------------------------------------------------

        prestationsMap.set(

            prestation.id,

            {

                id:
                    prestation.id,

                numero_prestation:
                    prestation.numero_prestation,

                dum:
                    prestation.dum,

                camion_id:
                    prestation.camion_id,

                chauffeur_id:
                    prestation.chauffeur_id,

                marchandise_id:
                    prestation.marchandise_id,

                zone_id:
                    prestation.zone_id,

                agent_id:
                    prestation.agent_id,

                type_operation:
                    prestation.type_operation,

                statut:
                    prestation.statut,

                priorite:
                    prestation.priorite,

                quantite_prevue:
                    prestation.quantite_prevue,

                quantite_realisee:
                    prestation.quantite_realisee,

                quantite_restante:
                    quantiteRestante,

                unite:
                    prestation.unite,

                emplacement:
                    prestation.emplacement,

                observations:
                    prestation.observations,

                date_creation:
                    prestation.date_creation,

                date_affectation:
                    prestation.date_affectation,

                date_arrivee_camion:
                    prestation.date_arrivee_camion,

                date_debut:
                    prestation.date_debut,

                date_fin:
                    prestation.date_fin,

                created_at:
                    prestation.created_at,

                updated_at:
                    prestation.updated_at,

                autorisation: {

                    id:
                        autorisation.id,

                    type_autorisation:
                        autorisation.type_autorisation,

                    prestation_id:
                        autorisation.prestation_id,

                    camion_id:
                        autorisation.camion_id,

                    chauffeur_id:
                        autorisation.chauffeur_id,

                    actif:
                        autorisation.actif,

                    date_debut:
                        autorisation.date_debut,

                    date_fin:
                        autorisation.date_fin,

                    observations:
                        autorisation.observations,

                },

            }
        );
    }


    // ========================================================
    // RESULTATS
    // ========================================================

    const resultats =
        Array.from(
            prestationsMap.values()
        );


    console.log(
        `[AUTORISATION] Camion ${camionId} -> ${resultats.length} prestation(s) autorisée(s)`
    );


    resultats.forEach(
        (prestation) => {

            console.log(
                `   → ${prestation.id} | ${prestation.numero_prestation} | ${prestation.statut} | reste=${prestation.quantite_restante}`
            );

        }
    );


    return resultats;
};


// ============================================================
// COMPATIBILITÉ ANCIENNE FONCTION
// ============================================================

const trouverPrestationAutoriseeParCamion = async (
    camionId,
    chauffeurId = null
) => {

    const prestations =
        await trouverPrestationsAutoriseesParCamion(
            camionId,
            chauffeurId
        );


    if (
        !prestations.length
    ) {

        return null;
    }


    return prestations[0];
};


// ============================================================
// VALIDATION RAPIDE
// ============================================================

const validerPrestationPourCamion = async (
    camionId,
    chauffeurId = null
) => {

    if (!camionId) {

        return {

            valide:
                false,

            raison:
                "CAMION_ID_MANQUANT",

            prestations:
                [],

        };
    }


    const prestations =
        await trouverPrestationsAutoriseesParCamion(
            camionId,
            chauffeurId
        );


    if (
        !prestations.length
    ) {

        return {

            valide:
                false,

            raison:
                "AUCUNE_PRESTATION_AUTORISEE",

            prestations:
                [],

        };
    }


    return {

        valide:
            true,

        raison:
            "AUTORISE",

        prestation:
            prestations[0],

        prestations,

    };
};


// ============================================================
// VALIDATION COMPLÈTE D'UNE PRESTATION
// ============================================================

const validerAccesPrestation = async ({
    prestationId,
    camionId,
    chauffeurId = null,
}) => {

    // --------------------------------------------------------
    // PRESTATION ID
    // --------------------------------------------------------

    if (!prestationId) {

        return {

            valide:
                false,

            raison:
                "PRESTATION_ID_MANQUANT",

        };
    }


    // --------------------------------------------------------
    // CAMION ID
    // --------------------------------------------------------

    if (!camionId) {

        return {

            valide:
                false,

            raison:
                "CAMION_ID_MANQUANT",

        };
    }


    // --------------------------------------------------------
    // PRESTATION
    // --------------------------------------------------------

    const prestation =
        await Prestation.findByPk(

            prestationId,

            {

                include: [

                    {

                        model:
                            Camion,

                        as:
                            "camion",

                        required:
                            false,

                    },

                    {

                        model:
                            Chauffeur,

                        as:
                            "chauffeur",

                        required:
                            false,

                    },

                    {

                        model:
                            Marchandise,

                        as:
                            "marchandise",

                        required:
                            false,

                    },

                ],

            }

        );


    if (!prestation) {

        return {

            valide:
                false,

            raison:
                "PRESTATION_INTROUVABLE",

        };
    }


    // --------------------------------------------------------
    // STATUT
    // --------------------------------------------------------

    const statut =
        normaliserStatut(
            prestation.statut
        );


    if (
        STATUTS_BLOQUES.includes(
            statut
        )
    ) {

        return {

            valide:
                false,

            raison:
                "PRESTATION_NON_ACTIVE",

            statut:
                prestation.statut,

        };
    }


    // --------------------------------------------------------
    // CAMION
    // --------------------------------------------------------

    const camion =
        await Camion.findByPk(
            camionId
        );


    if (!camion) {

        return {

            valide:
                false,

            raison:
                "CAMION_INTROUVABLE",

        };
    }


    // --------------------------------------------------------
    // AUTORISATION
    // --------------------------------------------------------

    const autorisation =
        await verifierAutorisationPrestation({

            prestationId,

            camionId,

            chauffeurId,

        });


    if (
        !autorisation.autorise
    ) {

        return {

            valide:
                false,

            raison:
                autorisation.raison,

            statut:
                prestation.statut,

        };
    }


    // --------------------------------------------------------
    // CHAUFFEUR
    // --------------------------------------------------------

    let chauffeur =
        null;


    if (chauffeurId) {

        chauffeur =
            await Chauffeur.findByPk(
                chauffeurId
            );


        if (!chauffeur) {

            return {

                valide:
                    false,

                raison:
                    "CHAUFFEUR_INTROUVABLE",

            };
        }
    }


    // --------------------------------------------------------
    // MARCHANDISE
    // --------------------------------------------------------

    let marchandise =
        null;


    if (
        prestation.marchandise_id
    ) {

        marchandise =
            await Marchandise.findByPk(
                prestation.marchandise_id
            );


        if (!marchandise) {

            return {

                valide:
                    false,

                raison:
                    "MARCHANDISE_INTROUVABLE",

            };
        }
    }


    // --------------------------------------------------------
    // QUANTITÉ
    // --------------------------------------------------------

    let quantiteRestante =
        null;


    if (
        prestation.quantite_prevue !==
        null &&
        prestation.quantite_prevue !==
        undefined
    ) {

        const prevue =
            Number(
                prestation.quantite_prevue
            );


        const realisee =
            Number(
                prestation.quantite_realisee ||
                0
            );


        quantiteRestante =
            Math.max(
                0,
                prevue -
                realisee
            );


        if (
            quantiteRestante <= 0
        ) {

            return {

                valide:
                    false,

                raison:
                    "QUANTITE_PRESTATION_EPUISEE",

                quantite_prevue:
                    prevue,

                quantite_realisee:
                    realisee,

                quantite_restante:
                    0,

            };
        }
    }


    // --------------------------------------------------------
    // RÉSULTAT
    // --------------------------------------------------------

    return {

        valide:
            true,

        raison:
            "AUTORISE",

        prestation: {

            id:
                prestation.id,

            numero_prestation:
                prestation.numero_prestation,

            dum:
                prestation.dum,

            camion_id:
                prestation.camion_id,

            chauffeur_id:
                prestation.chauffeur_id,

            marchandise_id:
                prestation.marchandise_id,

            zone_id:
                prestation.zone_id,

            agent_id:
                prestation.agent_id,

            type_operation:
                prestation.type_operation,

            statut:
                prestation.statut,

            priorite:
                prestation.priorite,

            quantite_prevue:
                prestation.quantite_prevue,

            quantite_realisee:
                prestation.quantite_realisee,

            quantite_restante:
                quantiteRestante,

            unite:
                prestation.unite,

            emplacement:
                prestation.emplacement,

            observations:
                prestation.observations,

            date_creation:
                prestation.date_creation,

            date_affectation:
                prestation.date_affectation,

            date_arrivee_camion:
                prestation.date_arrivee_camion,

            date_debut:
                prestation.date_debut,

            date_fin:
                prestation.date_fin,

        },

        camion,

        chauffeur,

        marchandise,

    };
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    verifierCamionAutorise,

    verifierAutorisationPrestation,

    trouverPrestationsAutoriseesParCamion,

    trouverPrestationAutoriseeParCamion,

    validerPrestationPourCamion,

    validerAccesPrestation,

};