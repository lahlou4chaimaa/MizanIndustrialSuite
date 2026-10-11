const {
    Prestation,
    PrestationFacturation,
    Ticket,
    Camion,
    Chauffeur,
    Marchandise,
    Zone,
    Pesee,
    PrestationAutorisation,
    PrestationCamion,
} = require("../models");

const { Op } = require("sequelize");

const {
    trouverPrestationsAutoriseesParCamion,
    verifierAutorisationPrestation,
} = require("./prestationAutorisationService");


// ============================================================
// UTILITAIRE : GÉNÉRER UN NUMÉRO DE PRESTATION
// ============================================================

const genererNumeroPrestation = () => {
    const maintenant = new Date();

    const annee = maintenant.getFullYear();

    const mois = String(
        maintenant.getMonth() + 1
    ).padStart(2, "0");

    const jour = String(
        maintenant.getDate()
    ).padStart(2, "0");

    const heure = String(
        maintenant.getHours()
    ).padStart(2, "0");

    const minute = String(
        maintenant.getMinutes()
    ).padStart(2, "0");

    const seconde = String(
        maintenant.getSeconds()
    ).padStart(2, "0");

    const millisecondes = String(
        maintenant.getMilliseconds()
    ).padStart(3, "0");

    return `PREST-${annee}${mois}${jour}-${heure}${minute}${seconde}-${millisecondes}`;
};


// ============================================================
// UTILITAIRE : INCLUDES DES RELATIONS
// ============================================================
//
// IMPORTANT
//
// Une prestation peut maintenant avoir :
//
// - plusieurs autorisations
// - plusieurs camions
// - plusieurs facturations
// - plusieurs tickets
// - plusieurs pesées
//
// Les tables documents / operations / events existent peut-être
// en PostgreSQL mais aucun modèle Sequelize n'est actuellement
// disponible.
//
// Elles seront donc ajoutées comme [] plus bas.
//
// ============================================================

const includeRelations = [
    {
        model: Camion,
        as: "camion",
        required: false,
    },

    {
        model: Chauffeur,
        as: "chauffeur",
        required: false,
    },

    {
        model: Marchandise,
        as: "marchandise",
        required: false,
    },

    {
        model: Zone,
        as: "zone",
        required: false,
    },

    // --------------------------------------------------------
    // TICKETS
    // --------------------------------------------------------

    {
        model: Ticket,
        as: "tickets",
        required: false,
    },

    // --------------------------------------------------------
    // PESEES
    // --------------------------------------------------------

    {
        model: Pesee,
        as: "pesees",
        required: false,
    },

    // --------------------------------------------------------
    // AUTORISATIONS
    // --------------------------------------------------------

    {
        model: PrestationAutorisation,
        as: "autorisations",
        required: false,

        include: [
            {
                model: Camion,
                as: "camion",
                required: false,
            },

            {
                model: Chauffeur,
                as: "chauffeur",
                required: false,
            },
        ],
    },

    // --------------------------------------------------------
    // CAMIONS DE LA PRESTATION
    // --------------------------------------------------------

    {
        model: PrestationCamion,
        as: "camionsPrestation",
        required: false,

        include: [
            {
                model: Camion,
                as: "camion",
                required: false,
            },
        ],
    },

    // --------------------------------------------------------
    // FACTURATIONS
    // --------------------------------------------------------

    {
        model: PrestationFacturation,
        as: "facturations",
        required: false,
    },
];


// ============================================================
// UTILITAIRE : QUANTITÉ
// ============================================================

const serialiserQuantite = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const nombre = Number(value);

    if (Number.isNaN(nombre)) {
        return value;
    }

    return nombre;
};


// ============================================================
// UTILITAIRE : QUANTITÉ RESTANTE
// ============================================================

const calculerQuantiteRestante = (
    prestation
) => {
    const quantitePrevue =
        prestation.quantite_prevue !== null &&
            prestation.quantite_prevue !== undefined
            ? Number(
                prestation.quantite_prevue
            )
            : null;

    const quantiteRealisee =
        prestation.quantite_realisee !== null &&
            prestation.quantite_realisee !== undefined
            ? Number(
                prestation.quantite_realisee
            )
            : 0;

    if (quantitePrevue === null) {
        return null;
    }

    return Math.max(
        0,
        quantitePrevue -
        quantiteRealisee
    );
};


// ============================================================
// UTILITAIRE : RÉCUPÉRER L'AFFECTATION D'UN CAMION
// ============================================================

const trouverAffectationCamion = async (
    prestationId,
    camionId,
    options = {}
) => {
    if (!prestationId || !camionId) {
        return null;
    }

    const affectation =
        await PrestationCamion.findOne({
            where: {
                prestation_id:
                    prestationId,

                camion_id:
                    camionId,
            },

            ...options,
        });

    if (!affectation) {
        return null;
    }

    return {
        id:
            affectation.id,

        prestation_id:
            affectation.prestation_id,

        camion_id:
            affectation.camion_id,

        quantite_prevue:
            serialiserQuantite(
                affectation.quantite_prevue
            ),

        quantite_realisee:
            serialiserQuantite(
                affectation.quantite_realisee
            ),

        quantite_restante:
            affectation.quantite_prevue !== null &&
                affectation.quantite_prevue !== undefined
                ? Math.max(
                    0,
                    Number(
                        affectation.quantite_prevue
                    ) -
                    Number(
                        affectation.quantite_realisee ||
                        0
                    )
                )
                : null,

        statut:
            affectation.statut,

        date_affectation:
            affectation.date_affectation,

        date_debut:
            affectation.date_debut,

        date_fin:
            affectation.date_fin,

        observations:
            affectation.observations,
    };
};


// ============================================================
// UTILITAIRE : ENRICHIR UNE PRESTATION
// ============================================================
//
// Ajoute :
//
// prestationCamion
// quantiteRestante
// documents
// operations
// events
//
// Les trois derniers restent [] tant que leurs modèles
// Sequelize ne sont pas disponibles.
//
// ============================================================

const enrichirPrestation = async (
    prestation,
    camionId = null
) => {
    if (!prestation) {
        return null;
    }

    const quantiteRestante =
        calculerQuantiteRestante(
            prestation
        );

    prestation.setDataValue(
        "quantiteRestante",
        quantiteRestante
    );


    // --------------------------------------------------------
    // AFFECTATION DU CAMION SCANNÉ
    // --------------------------------------------------------

    if (camionId) {
        const affectation =
            await trouverAffectationCamion(
                prestation.id,
                camionId
            );

        prestation.setDataValue(
            "prestationCamion",
            affectation
        );
    } else if (
        prestation.camion_id
    ) {
        const affectation =
            await trouverAffectationCamion(
                prestation.id,
                prestation.camion_id
            );

        prestation.setDataValue(
            "prestationCamion",
            affectation
        );
    } else {
        prestation.setDataValue(
            "prestationCamion",
            null
        );
    }


    // --------------------------------------------------------
    // TABLES SANS MODÈLES SEQUELIZE
    // --------------------------------------------------------

    prestation.setDataValue(
        "documents",
        prestation.documents || []
    );

    prestation.setDataValue(
        "operations",
        prestation.operations || []
    );

    prestation.setDataValue(
        "events",
        prestation.events || []
    );


    // --------------------------------------------------------
    // NORMALISATION DES COLLECTIONS
    // --------------------------------------------------------

    prestation.setDataValue(
        "autorisations",
        prestation.autorisations || []
    );

    prestation.setDataValue(
        "camionsPrestation",
        prestation.camionsPrestation || []
    );

    prestation.setDataValue(
        "facturations",
        prestation.facturations || []
    );

    prestation.setDataValue(
        "tickets",
        prestation.tickets || []
    );

    prestation.setDataValue(
        "pesees",
        prestation.pesees || []
    );


    return prestation;
};


// ============================================================
// UTILITAIRE : ENRICHIR PLUSIEURS PRESTATIONS
// ============================================================

const enrichirPrestations = async (
    prestations,
    camionId = null
) => {
    if (!Array.isArray(prestations)) {
        return [];
    }

    for (
        const prestation of prestations
    ) {
        await enrichirPrestation(
            prestation,
            camionId
        );
    }

    return prestations;
};


// ============================================================
// CRÉER UNE PRESTATION
// ============================================================

exports.creerPrestation = async (
    req,
    res
) => {
    const transaction =
        await Prestation.sequelize.transaction();

    try {
        const {
            camion_id,
            chauffeur_id,
            marchandise_id,
            zone_id,
            agent_id,
            type_operation,
            statut,
            priorite,
            quantite_prevue,
            unite,
            emplacement,
            observations,
            dum,
            facturations,
        } = req.body;


        const numero_prestation =
            req.body.numero_prestation ||
            genererNumeroPrestation();


        // ----------------------------------------------------
        // CRÉATION PRESTATION
        // ----------------------------------------------------

        const prestation =
            await Prestation.create(
                {
                    numero_prestation,

                    dum:
                        dum || null,

                    camion_id:
                        camion_id !== undefined &&
                            camion_id !== null &&
                            camion_id !== ""
                            ? camion_id
                            : null,

                    chauffeur_id:
                        chauffeur_id !== undefined &&
                            chauffeur_id !== null &&
                            chauffeur_id !== ""
                            ? chauffeur_id
                            : null,

                    marchandise_id:
                        marchandise_id !== undefined &&
                            marchandise_id !== null &&
                            marchandise_id !== ""
                            ? marchandise_id
                            : null,

                    zone_id:
                        zone_id !== undefined &&
                            zone_id !== null &&
                            zone_id !== ""
                            ? zone_id
                            : null,

                    agent_id:
                        agent_id !== undefined &&
                            agent_id !== null &&
                            agent_id !== ""
                            ? agent_id
                            : null,

                    type_operation:
                        type_operation || null,

                    statut:
                        statut || "CREEE",

                    priorite:
                        priorite !== undefined &&
                            priorite !== null &&
                            priorite !== ""
                            ? priorite
                            : 0,

                    quantite_prevue:
                        quantite_prevue !== undefined &&
                            quantite_prevue !== null &&
                            quantite_prevue !== ""
                            ? quantite_prevue
                            : null,

                    quantite_realisee:
                        0,

                    unite:
                        unite || null,

                    emplacement:
                        emplacement || null,

                    observations:
                        observations || null,

                    date_creation:
                        new Date(),

                    created_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },

                {
                    transaction,
                }
            );


        // ----------------------------------------------------
        // AUTORISATION AUTOMATIQUE DU CAMION PRINCIPAL
        // ----------------------------------------------------

        if (
            camion_id !== undefined &&
            camion_id !== null &&
            camion_id !== ""
        ) {
            await PrestationAutorisation.create(
                {
                    prestation_id:
                        prestation.id,

                    camion_id:
                        camion_id,

                    chauffeur_id:
                        null,

                    type_autorisation:
                        "CAMION",

                    actif:
                        true,

                    date_debut:
                        new Date(),

                    date_fin:
                        null,

                    observations:
                        "Autorisation créée automatiquement lors de la création de la prestation.",
                },

                {
                    transaction,
                }
            );
        }


        // ----------------------------------------------------
        // FACTURATION
        // ----------------------------------------------------

        if (
            Array.isArray(
                facturations
            ) &&
            facturations.length > 0
        ) {
            for (
                const ligne
                of facturations
            ) {
                const quantite =
                    ligne.quantite !== undefined &&
                        ligne.quantite !== null &&
                        ligne.quantite !== ""
                        ? Number(
                            ligne.quantite
                        )
                        : 1;

                const prixUnitaire =
                    ligne.prix_unitaire !== undefined &&
                        ligne.prix_unitaire !== null &&
                        ligne.prix_unitaire !== ""
                        ? Number(
                            ligne.prix_unitaire
                        )
                        : 0;

                const tva =
                    ligne.tva !== undefined &&
                        ligne.tva !== null &&
                        ligne.tva !== ""
                        ? Number(
                            ligne.tva
                        )
                        : 20;

                const totalHt =
                    ligne.total_ht !== undefined &&
                        ligne.total_ht !== null &&
                        ligne.total_ht !== ""
                        ? Number(
                            ligne.total_ht
                        )
                        : quantite *
                        prixUnitaire;

                const totalTtc =
                    ligne.total_ttc !== undefined &&
                        ligne.total_ttc !== null &&
                        ligne.total_ttc !== ""
                        ? Number(
                            ligne.total_ttc
                        )
                        : totalHt *
                        (1 + tva / 100);


                await PrestationFacturation.create(
                    {
                        prestation_id:
                            prestation.id,

                        code:
                            ligne.code ||
                            null,

                        libelle:
                            ligne.libelle,

                        quantite,

                        unite:
                            ligne.unite ||
                            null,

                        prix_unitaire:
                            prixUnitaire,

                        tva,

                        total_ht:
                            totalHt,

                        total_ttc:
                            totalTtc,
                    },

                    {
                        transaction,
                    }
                );
            }
        }


        await transaction.commit();


        // ----------------------------------------------------
        // RECHARGEMENT COMPLET
        // ----------------------------------------------------

        const prestationComplete =
            await Prestation.findByPk(
                prestation.id,
                {
                    include:
                        includeRelations,
                }
            );


        await enrichirPrestation(
            prestationComplete
        );


        return res.status(201).json({
            success: true,

            message:
                "Prestation créée avec succès.",

            prestation:
                prestationComplete,
        });

    } catch (error) {

        try {
            if (
                transaction &&
                !transaction.finished
            ) {
                await transaction.rollback();
            }
        } catch (rollbackError) {
            console.error(
                "[PRESTATION] Erreur rollback :",
                rollbackError
            );
        }


        console.error(
            "[PRESTATION] Erreur création :",
            error
        );


        return res.status(500).json({
            success: false,

            message:
                "Erreur lors de la création de la prestation.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// GET TOUTES LES PRESTATIONS
// ============================================================

exports.getPrestations = async (
    req,
    res
) => {
    try {
        const {
            statut,
            camion_id,
            chauffeur_id,
            marchandise_id,
            zone_id,
        } = req.query;


        const where = {};


        if (statut) {
            where.statut = statut;
        }

        if (camion_id) {
            where.camion_id = camion_id;
        }

        if (chauffeur_id) {
            where.chauffeur_id =
                chauffeur_id;
        }

        if (marchandise_id) {
            where.marchandise_id =
                marchandise_id;
        }

        if (zone_id) {
            where.zone_id = zone_id;
        }


        const prestations =
            await Prestation.findAll({
                where,

                include:
                    includeRelations,

                order: [
                    [
                        "priorite",
                        "DESC",
                    ],

                    [
                        "date_creation",
                        "DESC",
                    ],
                ],
            });


        await enrichirPrestations(
            prestations
        );


        return res.json({
            success: true,

            count:
                prestations.length,

            prestations,
        });

    } catch (error) {

        console.error(
            "[PRESTATION] Erreur récupération :",
            error
        );


        return res.status(500).json({
            success: false,

            message:
                "Erreur lors de la récupération des prestations.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// GET UNE PRESTATION PAR ID
// ============================================================

exports.getPrestationById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;


        const prestation =
            await Prestation.findByPk(
                id,
                {
                    include:
                        includeRelations,
                }
            );


        if (!prestation) {
            return res.status(404).json({
                success: false,

                message:
                    "Prestation introuvable.",
            });
        }


        await enrichirPrestation(
            prestation
        );


        return res.json({
            success: true,

            prestation,
        });

    } catch (error) {

        console.error(
            "[PRESTATION] Erreur récupération ID :",
            error
        );


        return res.status(500).json({
            success: false,

            message:
                "Erreur lors de la récupération de la prestation.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// GET PRESTATIONS PAR QR DU TICKET
// ============================================================
//
// NOUVEAU COMPORTEMENT
//
// Un QR peut maintenant donner :
//
// ticket
//   ↓
// camion
//   ↓
// prestation 7
// prestation 17
// prestation 22
//
// Le PDA reçoit toutes les prestations compatibles.
//
// ============================================================

exports.getPrestationByQr = async (
    req,
    res
) => {
    try {

        const { qrCode } =
            req.params;


        const cleanQrCode =
            qrCode
                ? String(
                    qrCode
                ).trim()
                : "";


        if (!cleanQrCode) {
            return res.status(400).json({
                success: false,

                message:
                    "Le QR code est obligatoire.",
            });
        }


        console.log(
            "[PRESTATION QR] Recherche :",
            cleanQrCode
        );


        // ----------------------------------------------------
        // TICKET
        // ----------------------------------------------------

        const ticket =
            await Ticket.findOne({
                where: {
                    qr_code:
                        cleanQrCode,
                },

                include: [
                    {
                        model: Camion,
                        as: "camion",
                        required: false,
                    },

                    {
                        model: Chauffeur,
                        as: "chauffeur",
                        required: false,
                    },

                    {
                        model: Marchandise,
                        as: "marchandise",
                        required: false,
                    },

                    {
                        model: Pesee,
                        as: "pesee",
                        required: false,
                    },

                    {
                        model: Prestation,
                        as: "prestation",
                        required: false,
                    },
                ],
            });


        if (!ticket) {
            return res.status(404).json({
                success: false,

                message:
                    "Ticket introuvable avec ce QR code.",
            });
        }


        // ----------------------------------------------------
        // CAMION
        // ----------------------------------------------------

        const camionId =
            ticket.camion_id ||
            ticket.camion?.id ||
            null;


        // ----------------------------------------------------
        // TICKET DÉJÀ AFFECTÉ
        // ----------------------------------------------------

        if (ticket.prestation_id) {

            const prestation =
                await Prestation.findByPk(
                    ticket.prestation_id,
                    {
                        include:
                            includeRelations,
                    }
                );


            if (!prestation) {
                return res.status(404).json({
                    success: false,

                    message:
                        "La prestation associée au ticket est introuvable.",

                    prestation_id:
                        ticket.prestation_id,
                });
            }


            await enrichirPrestation(
                prestation,
                camionId
            );


            return res.json({
                success: true,

                count: 1,

                ticket,

                deja_affecte: true,

                prestations: [
                    prestation,
                ],
            });
        }


        // ----------------------------------------------------
        // CAMION OBLIGATOIRE
        // ----------------------------------------------------

        if (!camionId) {
            return res.status(400).json({
                success: false,

                message:
                    "Aucun camion associé à ce ticket.",

                raison:
                    "CAMION_MANQUANT",
            });
        }


        // ----------------------------------------------------
        // CHAUFFEUR DU TICKET
        // ----------------------------------------------------

        const chauffeurId =
            ticket.chauffeur_id ||
            ticket.chauffeur?.id ||
            null;


        // ----------------------------------------------------
        // MARCHANDISE DU TICKET
        // ----------------------------------------------------

        const ticketMarchandiseId =
            ticket.marchandise_id ||
            ticket.marchandise?.id ||
            null;


        // ----------------------------------------------------
        // RECHERCHE DE TOUTES LES PRESTATIONS
        // ----------------------------------------------------

        const prestationsAutorisees =
            await trouverPrestationsAutoriseesParCamion(
                camionId,
                chauffeurId
            );


        if (
            !prestationsAutorisees.length
        ) {

            return res.status(403).json({
                success: false,

                message:
                    "Aucune prestation active n'est autorisée pour ce camion.",

                raison:
                    "AUCUNE_PRESTATION_AUTORISEE",

                camion_id:
                    camionId,

                prestations: [],
            });
        }


        // ----------------------------------------------------
        // FILTRAGE MARCHANDISE
        // ----------------------------------------------------

        const prestationsCompatibles =
            prestationsAutorisees.filter(
                (prestation) => {

                    /*
                     * Si le ticket n'a pas de marchandise,
                     * on ne bloque pas.
                     */

                    if (!ticketMarchandiseId) {
                        return true;
                    }


                    /*
                     * Si la prestation n'a pas de marchandise,
                     * on ne bloque pas.
                     */

                    if (
                        !prestation.marchandise_id
                    ) {
                        return true;
                    }


                    return (
                        Number(
                            ticketMarchandiseId
                        ) ===
                        Number(
                            prestation.marchandise_id
                        )
                    );
                }
            );


        if (
            !prestationsCompatibles.length
        ) {

            return res.status(403).json({
                success: false,

                message:
                    "Aucune des prestations autorisées ne correspond à la marchandise du ticket.",

                raison:
                    "MARCHANDISE_INCOMPATIBLE",

                camion_id:
                    camionId,

                ticket_marchandise_id:
                    ticketMarchandiseId,

                prestations: [],
            });
        }


        // ----------------------------------------------------
        // RECHARGEMENT COMPLET
        // ----------------------------------------------------

        const prestationsCompletes = [];


        for (
            const prestationAutorisee
            of prestationsCompatibles
        ) {

            const prestation =
                await Prestation.findByPk(
                    prestationAutorisee.id,
                    {
                        include:
                            includeRelations,
                    }
                );


            if (!prestation) {
                continue;
            }


            // ------------------------------------------------
            // QUANTITÉ
            // ------------------------------------------------

            const quantiteRestante =
                calculerQuantiteRestante(
                    prestation
                );


            if (
                quantiteRestante !== null &&
                quantiteRestante <= 0
            ) {

                console.log(
                    `[PRESTATION QR] Prestation ${prestation.id} ignorée : quantité épuisée`
                );

                continue;
            }


            // ------------------------------------------------
            // ENRICHISSEMENT
            // ------------------------------------------------

            await enrichirPrestation(
                prestation,
                camionId
            );


            prestationsCompletes.push(
                prestation
            );
        }


        // ----------------------------------------------------
        // AUCUNE PRESTATION APRÈS FILTRES
        // ----------------------------------------------------

        if (
            !prestationsCompletes.length
        ) {

            return res.status(409).json({
                success: false,

                message:
                    "Les prestations autorisées pour ce camion ne disposent plus de quantité disponible.",

                raison:
                    "QUANTITE_EPUISEE",

                camion_id:
                    camionId,

                prestations: [],
            });
        }


        console.log(
            `[PRESTATION QR] ${prestationsCompletes.length} prestation(s) disponible(s) pour camion ${camionId}`
        );


        prestationsCompletes.forEach(
            (prestation) => {

                console.log(
                    `   → ${prestation.id} | ${prestation.numero_prestation} | ${prestation.statut}`
                );
            }
        );


        return res.json({
            success: true,

            count:
                prestationsCompletes.length,

            ticket,

            deja_affecte: false,

            camion_id:
                camionId,

            prestations:
                prestationsCompletes,
        });

    } catch (error) {

        console.error(
            "[PRESTATION] Erreur recherche par QR :",
            error
        );

        console.error(
            "[PRESTATION] Message :",
            error?.message
        );

        console.error(
            "[PRESTATION] Stack :",
            error?.stack
        );


        return res.status(500).json({
            success: false,

            message:
                "Erreur lors de la recherche des prestations par QR.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// AFFECTER UNE PRESTATION À UN TICKET
// ============================================================

exports.affecterPrestation = async (
    req,
    res
) => {

    const transaction =
        await Prestation.sequelize.transaction();


    try {

        const { id } =
            req.params;


        const {
            ticket_id,
            agent_id,
        } = req.body;


        console.log(
            "[PRESTATION] Début affectation :",
            {
                prestation_id: id,

                ticket_id,

                agent_id,
            }
        );


        // ----------------------------------------------------
        // VALIDATION TICKET
        // ----------------------------------------------------

        if (!ticket_id) {

            await transaction.rollback();

            return res.status(400).json({
                success: false,

                message:
                    "ticket_id est obligatoire.",
            });
        }


        // ----------------------------------------------------
        // PRESTATION
        // ----------------------------------------------------

        const prestation =
            await Prestation.findByPk(
                id,
                {
                    transaction,

                    lock:
                        transaction.LOCK.UPDATE,
                }
            );


        if (!prestation) {

            await transaction.rollback();

            return res.status(404).json({
                success: false,

                message:
                    "Prestation introuvable.",
            });
        }


        // ----------------------------------------------------
        // STATUT
        // ----------------------------------------------------

        if (
            [
                "TERMINEE",
                "ANNULEE",
                "CLOTUREE",
            ].includes(
                prestation.statut
            )
        ) {

            await transaction.rollback();

            return res.status(409).json({
                success: false,

                message:
                    "Cette prestation ne peut plus être affectée.",

                statut:
                    prestation.statut,
            });
        }


        // ----------------------------------------------------
        // QUANTITÉ
        // ----------------------------------------------------

        const quantiteRestante =
            calculerQuantiteRestante(
                prestation
            );


        if (
            quantiteRestante !== null &&
            quantiteRestante <= 0
        ) {

            await transaction.rollback();

            return res.status(409).json({
                success: false,

                message:
                    "La quantité prévue pour cette prestation est déjà atteinte.",

                raison:
                    "QUANTITE_EPUISEE",

                quantite_prevue:
                    serialiserQuantite(
                        prestation.quantite_prevue
                    ),

                quantite_realisee:
                    serialiserQuantite(
                        prestation.quantite_realisee
                    ),
            });
        }


        // ----------------------------------------------------
        // TICKET
        // ----------------------------------------------------

        const ticket =
            await Ticket.findByPk(
                ticket_id,
                {
                    transaction,

                    lock:
                        transaction.LOCK.UPDATE,
                }
            );


        if (!ticket) {

            await transaction.rollback();

            return res.status(404).json({
                success: false,

                message:
                    "Ticket introuvable.",
            });
        }


        // ----------------------------------------------------
        // TICKET DÉJÀ AFFECTÉ
        // ----------------------------------------------------

        if (
            ticket.prestation_id &&
            Number(
                ticket.prestation_id
            ) !==
            Number(
                prestation.id
            )
        ) {

            await transaction.rollback();

            return res.status(409).json({
                success: false,

                message:
                    "Ce ticket est déjà affecté à une autre prestation.",

                prestation_existante_id:
                    ticket.prestation_id,
            });
        }


        // ----------------------------------------------------
        // CAMION
        // ----------------------------------------------------

        const camionId =
            ticket.camion_id ||
            null;


        if (!camionId) {

            await transaction.rollback();

            return res.status(400).json({
                success: false,

                message:
                    "Aucun camion associé à ce ticket. Impossible de vérifier son autorisation.",

                raison:
                    "CAMION_MANQUANT",
            });
        }


        // ----------------------------------------------------
        // CHAUFFEUR
        // ----------------------------------------------------

        const chauffeurId =
            ticket.chauffeur_id ||
            null;


        // ----------------------------------------------------
        // AUTORISATION DE LA PRESTATION
        // ----------------------------------------------------
        //
        // IMPORTANT :
        //
        // On ne recherche plus "la meilleure prestation
        // du camion".
        //
        // Le PDA a sélectionné une prestation précise.
        //
        // On vérifie donc :
        //
        // prestation sélectionnée
        // +
        // camion du ticket
        //
        // ====================================================

        const autorisation =
            await verifierAutorisationPrestation({
                prestationId:
                    prestation.id,

                camionId,

                chauffeurId,
            });


        if (!autorisation.autorise) {

            await transaction.rollback();

            return res.status(403).json({
                success: false,

                message:
                    "Ce camion n'est pas autorisé pour la prestation sélectionnée.",

                raison:
                    autorisation.raison,

                camion_id:
                    camionId,

                prestation_id:
                    prestation.id,
            });
        }


        // ----------------------------------------------------
        // MARCHANDISE
        // ----------------------------------------------------

        const ticketMarchandiseId =
            ticket.marchandise_id ||
            null;


        if (
            ticketMarchandiseId &&
            prestation.marchandise_id &&
            Number(
                ticketMarchandiseId
            ) !==
            Number(
                prestation.marchandise_id
            )
        ) {

            await transaction.rollback();

            return res.status(403).json({
                success: false,

                message:
                    "La marchandise du ticket ne correspond pas à celle de la prestation.",

                raison:
                    "MARCHANDISE_INCOMPATIBLE",

                ticket_marchandise_id:
                    ticketMarchandiseId,

                prestation_marchandise_id:
                    prestation.marchandise_id,
            });
        }


        // ----------------------------------------------------
        // AFFECTATION TICKET
        // ----------------------------------------------------

        await ticket.update(
            {
                prestation_id:
                    prestation.id,
            },

            {
                transaction,
            }
        );


        // ----------------------------------------------------
        // SYNCHRONISATION PESEE
        // ----------------------------------------------------

        if (
            ticket.pesee_id
        ) {

            const pesee =
                await Pesee.findByPk(
                    ticket.pesee_id,
                    {
                        transaction,
                    }
                );


            if (pesee) {

                await pesee.update(
                    {
                        prestation_id:
                            prestation.id,
                    },

                    {
                        transaction,
                    }
                );
            }
        }


        // ----------------------------------------------------
        // MISE À JOUR PRESTATION
        // ----------------------------------------------------

        const updatePrestation = {

            updated_at:
                new Date(),
        };


        if (
            agent_id !== undefined &&
            agent_id !== null
        ) {

            updatePrestation.agent_id =
                agent_id;
        }


        if (
            !prestation.date_affectation
        ) {

            updatePrestation.date_affectation =
                new Date();
        }


        if (
            prestation.statut ===
            "CREEE"
        ) {

            updatePrestation.statut =
                "AFFECTEE";
        }


        await prestation.update(
            updatePrestation,
            {
                transaction,
            }
        );


        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await transaction.commit();


        // ----------------------------------------------------
        // RECHARGEMENT COMPLET
        // ----------------------------------------------------

        const prestationComplete =
            await Prestation.findByPk(
                prestation.id,
                {
                    include:
                        includeRelations,
                }
            );


        if (prestationComplete) {

            await enrichirPrestation(
                prestationComplete,
                camionId
            );
        }


        // ----------------------------------------------------
        // SOCKET
        // ----------------------------------------------------

        if (
            req.io &&
            prestationComplete
        ) {

            try {

                req.io.emit(
                    "prestation-affectee",
                    prestationComplete
                );

            } catch (socketError) {

                console.error(
                    "[PRESTATION] Erreur Socket.IO :",
                    socketError
                );
            }
        }


        // ----------------------------------------------------
        // RÉPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                "Prestation affectée au ticket avec succès.",

            prestation:
                prestationComplete,

            ticket_id:
                ticket.id,
        });

    } catch (error) {

        try {

            if (
                transaction &&
                !transaction.finished
            ) {

                await transaction.rollback();
            }

        } catch (rollbackError) {

            console.error(
                "[PRESTATION] Erreur rollback :",
                rollbackError
            );
        }


        console.error(
            "=================================================="
        );

        console.error(
            "[PRESTATION] ERREUR AFFECTATION"
        );

        console.error(
            "[PRESTATION] Message :",
            error?.message
        );

        console.error(
            "[PRESTATION] Name :",
            error?.name
        );

        console.error(
            "[PRESTATION] Stack :",
            error?.stack
        );

        console.error(
            "[PRESTATION] SQL :",
            error?.sql
        );

        console.error(
            "=================================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "Erreur lors de l'affectation de la prestation.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// CHANGER LE STATUT
// ============================================================

exports.changerStatut = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;

        const { statut } =
            req.body;


        if (!statut) {

            return res.status(400).json({
                success: false,

                message:
                    "Le statut est obligatoire.",
            });
        }


        const prestation =
            await Prestation.findByPk(
                id
            );


        if (!prestation) {

            return res.status(404).json({
                success: false,

                message:
                    "Prestation introuvable.",
            });
        }


        await prestation.update({

            statut,

            updated_at:
                new Date(),

            ...(statut ===
                "AFFECTEE"
                ? {
                    date_affectation:
                        prestation.date_affectation ||
                        new Date(),
                }
                : {}),

            ...(statut ===
                "EN_COURS"
                ? {
                    date_debut:
                        prestation.date_debut ||
                        new Date(),
                }
                : {}),

            ...(statut ===
                "TERMINEE"
                ? {
                    date_fin:
                        prestation.date_fin ||
                        new Date(),
                }
                : {}),
        });


        const prestationComplete =
            await Prestation.findByPk(
                prestation.id,
                {
                    include:
                        includeRelations,
                }
            );


        await enrichirPrestation(
            prestationComplete
        );


        if (
            req.io &&
            prestationComplete
        ) {

            req.io.emit(
                "prestation-statut-change",
                prestationComplete
            );
        }


        return res.json({

            success: true,

            message:
                "Statut de la prestation modifié.",

            prestation:
                prestationComplete,
        });

    } catch (error) {

        console.error(
            "[PRESTATION] Erreur changement statut :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Erreur lors du changement de statut.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// PRESTATIONS POUR PDA
// ============================================================

exports.getPrestationsPDA = async (
    req,
    res
) => {

    try {

        const statutsBloques = [
            "TERMINEE",
            "ANNULEE",
            "CLOTUREE",
        ];


        const prestations =
            await Prestation.findAll({

                where: {

                    statut: {
                        [Op.notIn]:
                            statutsBloques,
                    },
                },

                include:
                    includeRelations,

                order: [

                    [
                        "priorite",
                        "DESC",
                    ],

                    [
                        "date_creation",
                        "DESC",
                    ],
                ],
            });


        await enrichirPrestations(
            prestations
        );


        return res.json({

            success: true,

            count:
                prestations.length,

            prestations,
        });

    } catch (error) {

        console.error(
            "[PRESTATION PDA] Erreur :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Erreur lors de la récupération des prestations PDA.",

            error:
                error?.message,
        });
    }
};


// ============================================================
// PRESTATIONS PAR AGENT
// ============================================================

exports.getPrestationsParAgent =
    async (
        req,
        res
    ) => {

        try {

            const { agentId } =
                req.params;


            if (!agentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "agent_id est obligatoire.",
                });
            }


            const prestations =
                await Prestation.findAll({

                    where: {

                        agent_id:
                            agentId,
                    },

                    include:
                        includeRelations,

                    order: [

                        [
                            "date_creation",
                            "DESC",
                        ],
                    ],
                });


            await enrichirPrestations(
                prestations
            );


            return res.json({

                success: true,

                count:
                    prestations.length,

                prestations,
            });

        } catch (error) {

            console.error(
                "[PRESTATION AGENT] Erreur :",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Erreur lors de la récupération des prestations de l'agent.",

                error:
                    error?.message,
            });
        }
    };