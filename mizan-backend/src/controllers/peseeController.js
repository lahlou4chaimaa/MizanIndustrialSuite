const { Op } = require("sequelize");

const {
  Pesee,
  Ticket,
  Camion,
  Chauffeur,
  Marchandise,
  Prestation,
  PrestationFacturation,
  PrestationCamion,
} = require("../models");

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

/**
 * Détecte si une chaîne contient du texte arabe.
 */
function containsArabic(value) {
  return /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    String(value || "")
  );
}

/**
 * Répare un mojibake classique.
 */
function repairMojibake(value) {
  if (!value) {
    return value;
  }

  const original = String(value);

  if (containsArabic(original)) {
    return original;
  }

  try {
    const repaired = Buffer.from(original, "latin1").toString(
      "utf8"
    );

    if (containsArabic(repaired)) {
      return repaired;
    }
  } catch (_) {
    // On garde la valeur originale.
  }

  return original;
}

/**
 * Normalise un champ de matricule.
 */
function normalizePlateInput(value) {
  return repairMojibake(normalize(value));
}

function positiveNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

/**
 * Normalise l'unité de quantité.
 */
function normalizeQuantityUnit(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * Convertit le poids net de la balance, toujours en kg,
 * vers l'unité utilisée par la prestation.
 *
 * Exemples :
 *
 * 20 000 kg + T  -> 20 T
 * 20 000 kg + kg -> 20 000 kg
 *
 * Les unités comme m3 ne sont volontairement pas converties
 * car il faudrait connaître la densité de la marchandise.
 */
function convertPoidsNetToPrestationUnit(
  poidsNetKg,
  unite
) {
  const normalizedUnit =
    normalizeQuantityUnit(unite);

  switch (normalizedUnit) {
    case "kg":
    case "kgs":
    case "kilogramme":
    case "kilogrammes":
      return poidsNetKg;

    case "t":
    case "ton":
    case "tons":
    case "tonne":
    case "tonnes":
      return poidsNetKg / 1000;

    default:
      return null;
  }
}

function normalizePlateForComparison(value) {
  return normalize(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function generateTicketNumber() {
  const now = new Date();

  const yyyy = now.getFullYear();

  const mm = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const dd = String(
    now.getDate()
  ).padStart(2, "0");

  const hh = String(
    now.getHours()
  ).padStart(2, "0");

  const min = String(
    now.getMinutes()
  ).padStart(2, "0");

  const ss = String(
    now.getSeconds()
  ).padStart(2, "0");

  const random = Math.floor(
    100 + Math.random() * 900
  );

  return `TICKET-${yyyy}${mm}${dd}-${hh}${min}${ss}-${random}`;
}

function generateTicketQr() {
  return `QR-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
}

/* =========================================================
   INCLUDES
========================================================= */

function getPeseeIncludes() {
  return [
    {
      model: Camion,
      as: "camion",
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
      model: Prestation,
      as: "prestation",
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

        {
          model: Marchandise,
          as: "marchandise",
          required: false,
        },

        {
          model: PrestationFacturation,
          as: "facturations",
          required: false,
        },
      ],
    },

    {
      model: Ticket,
      as: "ticket",
      required: false,
    },
  ];
}

/* =========================================================
   GET ALL PESEES
========================================================= */

exports.getAll = async (req, res) => {
  try {
    const pesees =
      await Pesee.findAll({
        include: getPeseeIncludes(),

        order: [
          ["id", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      count: pesees.length,
      pesees,
    });
  } catch (error) {
    console.error(
      "Erreur getAll pesees:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de la récupération des pesées.",

      error:
        error.message,
    });
  }
};

/* =========================================================
   GET PESEE PAR ID
========================================================= */

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const pesee =
      await Pesee.findByPk(
        id,
        {
          include:
            getPeseeIncludes(),
        }
      );

    if (!pesee) {
      return res.status(404).json({
        success: false,

        message:
          "Pesée introuvable.",
      });
    }

    return res.status(200).json({
      success: true,

      pesee,
    });
  } catch (error) {
    console.error(
      "Erreur getById pesee:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de la récupération de la pesée.",

      error:
        error.message,
    });
  }
};

/* =========================================================
   PESEE EN COURS PAR CAMION
========================================================= */

exports.getPeseeEnCoursParCamion =
  async (req, res) => {
    try {
      const { camionId } =
        req.params;

      if (!camionId) {
        return res.status(400).json({
          success: false,

          message:
            "camionId est obligatoire.",
        });
      }

      const pesee =
        await Pesee.findOne({
          where: {
            camion_id:
              Number(camionId),

            statut:
              "ENTREE",
          },

          include:
            getPeseeIncludes(),

          order: [
            ["id", "DESC"],
          ],
        });

      return res.status(200).json({
        success: true,

        pesee:
          pesee || null,
      });
    } catch (error) {
      console.error(
        "Erreur getPeseeEnCoursParCamion:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Erreur lors de la récupération de la pesée en cours.",

        error:
          error.message,
      });
    }
  };

/* =========================================================
   CREER PESEE ENTREE
========================================================= */

exports.createEntree = async (req, res) => {
  const transaction =
    await Pesee.sequelize.transaction();

  try {
    const {
      prestation_id,
      camion_id,
      matriculeTracteur,
      matriculeRemorque,
      poidsEntree,
      codeQr,
      identite_confirmee,
      chauffeur_id,
      marchandise_id,
    } = req.body;

    /* -----------------------------------------------------
       VALIDATION TARE
    ----------------------------------------------------- */

    const poidsTare =
      positiveNumber(
        poidsEntree
      );

    if (poidsTare === null) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "Le poids de tare est invalide.",
      });
    }

    /* -----------------------------------------------------
       VALIDATION CAMION
    ----------------------------------------------------- */

    let camion = null;

    if (camion_id) {
      camion =
        await Camion.findByPk(
          camion_id,
          {
            transaction,
          }
        );
    }

    const scannedTracteur =
      normalizePlateInput(
        matriculeTracteur
      );

    if (!scannedTracteur) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "La matricule du tracteur est obligatoire.",
      });
    }

    /*
     * Si aucun camion_id n'est fourni,
     * recherche du camion par matricule.
     */

    if (!camion) {
      const allCamions =
        await Camion.findAll({
          transaction,
        });

      const normalizedScan =
        normalizePlateForComparison(
          scannedTracteur
        );

      camion =
        allCamions.find(
          (item) => {
            return (
              normalizePlateForComparison(
                item.immatriculation ||
                item.matricule ||
                item.numero_immatriculation ||
                ""
              ) ===
              normalizedScan
            );
          }
        ) || null;
    }

    if (!camion) {
      console.log(
        "[PESEE] Aucun camion trouvé. Création automatique:",
        scannedTracteur
      );

      camion =
        await Camion.create(
          {
            immatriculation:
              scannedTracteur.toUpperCase(),

            immatriculation_remorque:
              null,

            marque:
              null,

            societe_transport:
              null,

            date_enregistrement:
              new Date(),
          },
          {
            transaction,
          }
        );

      console.log(
        "[PESEE] Nouveau camion créé:",
        {
          id:
            camion.id,

          immatriculation:
            camion.immatriculation,
        }
      );
    }

    /* -----------------------------------------------------
       VERIFICATION MATRICULE CAMION
    ----------------------------------------------------- */

    const camionPlate =
      normalizePlateForComparison(
        camion.matricule ||
        camion.immatriculation ||
        camion.numero_immatriculation ||
        ""
      );

    const scannedPlate =
      normalizePlateForComparison(
        scannedTracteur
      );

    if (
      camionPlate &&
      camionPlate !== scannedPlate
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "La matricule scannée ne correspond pas au camion sélectionné.",
      });
    }

    /* -----------------------------------------------------
       REMORQUE
    ----------------------------------------------------- */

    const scannedRemorque =
      normalizePlateInput(
        matriculeRemorque
      ) || null;

    /* -----------------------------------------------------
       CHAUFFEUR
    ----------------------------------------------------- */

    let chauffeur = null;

    if (chauffeur_id) {
      chauffeur =
        await Chauffeur.findByPk(
          chauffeur_id,
          {
            transaction,
          }
        );

      if (!chauffeur) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,

          message:
            "Chauffeur introuvable.",
        });
      }
    }

    /* -----------------------------------------------------
       MARCHANDISE
    ----------------------------------------------------- */

    let marchandise = null;

    if (marchandise_id) {
      marchandise =
        await Marchandise.findByPk(
          marchandise_id,
          {
            transaction,
          }
        );

      if (!marchandise) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,

          message:
            "Marchandise introuvable.",
        });
      }
    }

    /* -----------------------------------------------------
       PESEE DEJA ACTIVE
    ----------------------------------------------------- */

    const peseeExistante =
      await Pesee.findOne({
        where: {
          camion_id:
            camion.id,

          statut:
            "ENTREE",
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (peseeExistante) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,

        message:
          "Ce camion possède déjà une pesée en cours.",

        pesee_id:
          peseeExistante.id,
      });
    }

    /* -----------------------------------------------------
       PRESTATION OPTIONNELLE
    ----------------------------------------------------- */

    let prestation = null;

    if (prestation_id) {
      prestation =
        await Prestation.findByPk(
          prestation_id,
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

      /*
       * IMPORTANT :
       *
       * On ne vérifie pas :
       *
       * prestation.camion_id === camion.id
       *
       * car une prestation peut être exécutée
       * par plusieurs camions.
       */
    }

    /* -----------------------------------------------------
       CREATION PESEE
    ----------------------------------------------------- */

    console.log(
      "========== DONNEES PESEE =========="
    );

    console.log({
      prestation_id:
        prestation?.id || null,

      camion_id:
        camion.id,

      chauffeur_id:
        chauffeur?.id || null,

      marchandise_id:
        marchandise?.id || null,

      matriculeTracteur:
        scannedTracteur,

      matriculeRemorque:
        scannedRemorque,

      poidsEntree:
        poidsTare,

      identite_confirmee,
    });

    console.log(
      "==================================="
    );

    const pesee =
      await Pesee.create(
        {
          prestation_id:
            prestation?.id ||
            null,

          camion_id:
            camion.id,

          chauffeur_id:
            chauffeur?.id ||
            null,

          marchandise_id:
            marchandise?.id ||
            null,

          immatriculation_tracteur_scanned:
            scannedTracteur,

          immatriculation_remorque_scanned:
            scannedRemorque,

          poids_tare:
            poidsTare,

          poids_brut:
            null,

          poids_net:
            null,

          photo_scan_url:
            null,

          identite_confirmee:
            identite_confirmee === true ||
            identite_confirmee === "true" ||
            identite_confirmee === "1",

          statut:
            "ENTREE",

          date_entree:
            new Date(),

          date_sortie:
            null,
        },
        {
          transaction,
        }
      );

    /* -----------------------------------------------------
       CREATION TICKET
    ----------------------------------------------------- */

    console.log(
      "========== DONNEES TICKET =========="
    );

    console.log({
      numero_ticket:
        "génération en cours",

      pesee_id:
        pesee.id,

      camion_id:
        camion.id,

      chauffeur_id:
        chauffeur?.id || null,

      marchandise_id:
        marchandise?.id || null,

      prestation_id:
        prestation?.id || null,

      matricule_tracteur:
        scannedTracteur,

      matricule_remorque:
        scannedRemorque,

      poids_tare:
        poidsTare,
    });

    console.log(
      "===================================="
    );

    const ticket =
      await Ticket.create(
        {
          numero_ticket:
            generateTicketNumber(),

          qr_code:
            generateTicketQr(),

          pesee_id:
            pesee.id,

          camion_id:
            camion.id,

          chauffeur_id:
            chauffeur?.id ||
            null,

          marchandise_id:
            marchandise?.id ||
            null,

          /*
           * Si une prestation est déjà connue,
           * elle est conservée.
           *
           * Sinon elle pourra être affectée
           * ultérieurement par le PDA.
           */
          prestation_id:
            prestation?.id ||
            null,

          matricule_tracteur:
            scannedTracteur,

          matricule_remorque:
            scannedRemorque,

          nom_chauffeur:
            chauffeur?.nom ||
            null,

          prenom_chauffeur:
            chauffeur?.prenom ||
            null,

          cin_chauffeur:
            chauffeur?.cin ||
            null,

          poids_tare:
            poidsTare,

          poids_brut:
            null,

          poids_net:
            null,

          statut:
            "ENTREE",

          date_entree:
            new Date(),

          date_sortie:
            null,
        },
        {
          transaction,
        }
      );

    /* -----------------------------------------------------
       COMMIT
    ----------------------------------------------------- */

    await transaction.commit();

    /* -----------------------------------------------------
       RECHARGEMENT
    ----------------------------------------------------- */

    const peseeComplete =
      await Pesee.findByPk(
        pesee.id,
        {
          include:
            getPeseeIncludes(),
        }
      );

    /* -----------------------------------------------------
       SOCKET
       
       IMPORTANT :
       createEntree ne possède pas encore de poids net.
       
       On envoie donc uniquement les informations
       réellement disponibles.
    ----------------------------------------------------- */

    if (req.io) {
      req.io.emit(
        "pesee-entree-enregistree",
        {
          pesee:
            peseeComplete,

          ticket,

          prestation_id:
            prestation?.id ||
            null,

          poids_tare:
            poidsTare,

          statut:
            "ENTREE",
        }
      );
    }

    return res.status(201).json({
      success: true,

      message:
        "Pesée d'entrée enregistrée avec succès.",

      pesee:
        peseeComplete,

      ticket,

      prestation_id:
        prestation?.id ||
        null,
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) { }

    console.error(
      "========== ERREUR CREATE ENTREE =========="
    );

    console.error(
      "Message :",
      error.message
    );

    console.error(
      "Name    :",
      error.name
    );

    console.error(
      "SQL     :",
      error.sql
    );

    console.error(
      "Parent  :",
      error.parent
    );

    console.error(
      "Original:",
      error.original
    );

    console.error(
      "Stack   :",
      error.stack
    );

    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de l'enregistrement de la pesée d'entrée.",

      error:
        error.message,
    });
  }
};


/* =========================================================
   CREER PESEE SORTIE
========================================================= */

exports.createSortie = async (req, res) => {
  const transaction =
    await Pesee.sequelize.transaction();

  /*
   * Tolérance autorisée :
   *
   * Exemple :
   * quantité prévue camion = 20 T
   *
   * 5 % de 20 = 1 T
   *
   * Intervalle accepté :
   * 19 T → 21 T
   */
  const TOLERANCE_PERCENT = 0.05;

  try {
    const { id } = req.params;

    const {
      poidsBrut,
      matriculeTracteur,
      matriculeRemorque,
    } = req.body;

    /* -----------------------------------------------------
       VALIDATION POIDS BRUT
    ----------------------------------------------------- */

    const poidsBrutNumber =
      positiveNumber(poidsBrut);

    if (poidsBrutNumber === null) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "Le poids brut est invalide.",
      });
    }

    /* -----------------------------------------------------
       PESEE
    ----------------------------------------------------- */

    const pesee =
      await Pesee.findByPk(
        id,
        {
          transaction,

          lock:
            transaction.LOCK.UPDATE,
        }
      );

    if (!pesee) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,

        message:
          "Pesée introuvable.",
      });
    }

    /* -----------------------------------------------------
       VERIFICATION STATUT PESEE
    ----------------------------------------------------- */

    if (pesee.statut === "VALIDE") {
      await transaction.rollback();

      return res.status(409).json({
        success: false,

        message:
          "Cette pesée est déjà validée.",
      });
    }

    if (pesee.statut === "ANNULEE") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "Cette pesée est annulée.",
      });
    }

    /* =====================================================
       VERIFICATION MATRICULES SORTIE
    ===================================================== */

    /*
     * IMPORTANT :
     *
     * Les matricules enregistrés par createEntree
     * sont :
     *
     * immatriculation_tracteur_scanned
     * immatriculation_remorque_scanned
     */

    const matriculeTracteurSortie =
      normalizePlateForComparison(
        matriculeTracteur
      );

    const matriculeTracteurEntree =
      normalizePlateForComparison(
        pesee.immatriculation_tracteur_scanned
      );

    const matriculeRemorqueSortie =
      normalizePlateForComparison(
        matriculeRemorque
      );

    const matriculeRemorqueEntree =
      normalizePlateForComparison(
        pesee.immatriculation_remorque_scanned
      );

    /* -----------------------------------------------------
       TRACTEUR OBLIGATOIRE
    ----------------------------------------------------- */

    if (!matriculeTracteurSortie) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        code:
          "MATRICULE_TRACTEUR_MANQUANT",

        message:
          "Le matricule du tracteur est obligatoire pour la sortie.",
      });
    }

    /* -----------------------------------------------------
       TRACTEUR ENREGISTRE A L'ENTREE
    ----------------------------------------------------- */

    if (!matriculeTracteurEntree) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,

        code:
          "MATRICULE_TRACTEUR_ENTREE_ABSENT",

        message:
          "Aucun matricule tracteur n'est enregistré sur la pesée d'entrée.",
      });
    }

    /* -----------------------------------------------------
       COMPARAISON TRACTEUR
    ----------------------------------------------------- */

    if (
      matriculeTracteurSortie !==
      matriculeTracteurEntree
    ) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,

        code:
          "MATRICULE_TRACTEUR_DIFFERENT",

        message:
          "Le matricule du tracteur à la sortie ne correspond pas à celui enregistré à l'entrée.",

        matricule_entree:
          pesee.immatriculation_tracteur_scanned,

        matricule_sortie:
          matriculeTracteur,
      });
    }

    /* -----------------------------------------------------
       VERIFICATION REMORQUE
    ----------------------------------------------------- */

    /*
     * Si une remorque était présente à l'entrée,
     * elle doit obligatoirement être présente
     * et identique à la sortie.
     */

    if (matriculeRemorqueEntree) {

      if (!matriculeRemorqueSortie) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,

          code:
            "MATRICULE_REMORQUE_MANQUANT",

          message:
            "Une remorque était enregistrée à l'entrée. Son matricule doit être vérifié à la sortie.",

          matricule_remorque_entree:
            pesee.immatriculation_remorque_scanned,
        });
      }

      if (
        matriculeRemorqueSortie !==
        matriculeRemorqueEntree
      ) {
        await transaction.rollback();

        return res.status(409).json({
          success: false,

          code:
            "MATRICULE_REMORQUE_DIFFERENTE",

          message:
            "Le matricule de la remorque à la sortie ne correspond pas à celui enregistré à l'entrée.",

          matricule_entree:
            pesee.immatriculation_remorque_scanned,

          matricule_sortie:
            matriculeRemorque,
        });
      }
    }

    /*
     * Si aucune remorque n'était enregistrée à l'entrée,
     * on n'impose pas de remorque à la sortie.
     */

    /* =====================================================
       CALCUL POIDS NET
    ===================================================== */

    const poidsTare =
      Number(pesee.poids_tare);

    const poidsNet =
      poidsBrutNumber -
      poidsTare;

    if (
      !Number.isFinite(poidsNet) ||
      poidsNet < 0
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,

        message:
          "Le poids brut doit être supérieur ou égal au poids de tare.",

        poids_tare:
          poidsTare,

        poids_brut:
          poidsBrutNumber,
      });
    }

    /* =====================================================
       TICKET
    ===================================================== */

    const ticket =
      await Ticket.findOne({
        where: {
          pesee_id:
            pesee.id,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!ticket) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,

        message:
          "Ticket associé à cette pesée introuvable.",
      });
    }

    /* =====================================================
       PRESTATION
    ===================================================== */

    /*
     * Source principale :
     *
     * ticket.prestation_id
     *
     * Fallback :
     *
     * pesee.prestation_id
     */

    const prestationId =
      ticket.prestation_id ||
      pesee.prestation_id ||
      null;

    let prestation = null;

    /*
     * Quantité réellement pesée
     * dans l'unité de la prestation.
     */

    let quantitePesee = null;

    /*
     * Quantité restante globale
     * de la prestation.
     */

    let quantiteRestante = null;

    let unitePrestation = null;

    /*
     * Ligne d'affectation du camion.
     */

    let prestationCamion = null;

    let quantitePrevueCamion = null;
    let quantiteRealiseeCamion = null;
    let quantiteRestanteCamion = null;

    let toleranceCamion = null;
    let quantiteMinCamion = null;
    let quantiteMaxCamion = null;

    /* =====================================================
       TRAITEMENT PRESTATION
    ===================================================== */

    if (prestationId) {

      prestation =
        await Prestation.findByPk(
          prestationId,
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
            "La prestation associée au ticket est introuvable.",

          prestation_id:
            prestationId,
        });
      }

      /* ---------------------------------------------------
         UNITE PRESTATION
      --------------------------------------------------- */

      unitePrestation =
        prestation.unite ||
        "kg";

      /* ---------------------------------------------------
         CONVERSION POIDS NET
      --------------------------------------------------- */

      quantitePesee =
        convertPoidsNetToPrestationUnit(
          poidsNet,
          unitePrestation
        );

      if (quantitePesee === null) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,

          message:
            `L'unité "${unitePrestation}" de la prestation ne permet pas de convertir automatiquement le poids de la balance.`,

          unite_prestation:
            unitePrestation,

          poids_net_kg:
            poidsNet,
        });
      }

      /* ===================================================
         AFFECTATION DU CAMION
      =================================================== */

      /*
       * IMPORTANT :
       *
       * On cherche :
       *
       * prestation_id
       * +
       * camion_id
       *
       * et non prestation.camion_id.
       */

      if (pesee.camion_id) {

        prestationCamion =
          await PrestationCamion.findOne({
            where: {
              prestation_id:
                prestation.id,

              camion_id:
                pesee.camion_id,
            },

            transaction,

            lock:
              transaction.LOCK.UPDATE,
          });
      }

      /* ===================================================
         VERIFICATION QUANTITE CAMION
      =================================================== */

      if (prestationCamion) {

        quantitePrevueCamion =
          Number(
            prestationCamion.quantite_prevue ||
            0
          );

        quantiteRealiseeCamion =
          Number(
            prestationCamion.quantite_realisee ||
            0
          );

        quantiteRestanteCamion =
          Math.max(
            quantitePrevueCamion -
            quantiteRealiseeCamion,
            0
          );

        /* -------------------------------------------------
           QUANTITE DEJA TERMINEE
        ------------------------------------------------- */

        if (
          quantiteRestanteCamion <= 0
        ) {
          await transaction.rollback();

          return res.status(409).json({
            success: false,

            code:
              "CAMION_QUANTITE_TERMINEE",

            message:
              "La quantité prévue pour ce camion est déjà entièrement réalisée.",

            prestation_id:
              prestation.id,

            camion_id:
              pesee.camion_id,

            quantite_prevue_camion:
              quantitePrevueCamion,

            quantite_realisee_camion:
              quantiteRealiseeCamion,

            quantite_restante_camion:
              0,

            unite:
              unitePrestation,
          });
        }

        /* -------------------------------------------------
           TOLERANCE 5 %
        ------------------------------------------------- */

        console.log(
          "[CAMION] Pesée partielle acceptée :",
          {
            prestation_id:
              prestation.id,

            camion_id:
              pesee.camion_id,

            quantite_prevue_camion:
              quantitePrevueCamion,

            quantite_realisee_camion:
              quantiteRealiseeCamion,

            quantite_restante_camion:
              quantiteRestanteCamion,

            quantite_pesee:
              quantitePesee,

            unite:
              unitePrestation,
          }
        );

        console.log(
          "[CAMION] Quantité acceptée avec tolérance de 5 % :",
          {
            prestation_id:
              prestation.id,

            camion_id:
              pesee.camion_id,

            quantite_prevue:
              quantitePrevueCamion,

            quantite_realisee_avant:
              quantiteRealiseeCamion,

            quantite_restante:
              quantiteRestanteCamion,

            quantite_pesee:
              quantitePesee,

            tolerance:
              toleranceCamion,

            minimum:
              quantiteMinCamion,

            maximum:
              quantiteMaxCamion,
          }
        );
      }

      /* ===================================================
         VERIFICATION QUANTITE GLOBALE
      =================================================== */

      const quantitePrevue =
        prestation.quantite_prevue !== null &&
          prestation.quantite_prevue !== undefined
          ? Number(
            prestation.quantite_prevue
          )
          : null;

      const quantiteRealisee =
        Number(
          prestation.quantite_realisee ||
          0
        );

      const quantiteRestanteAvant =
        quantitePrevue !== null
          ? Math.max(
            quantitePrevue -
            quantiteRealisee,
            0
          )
          : null;

      /*
       * Même si le camion respecte les 5 %,
       * on ne dépasse jamais la quantité globale.
       */

      if (
        quantiteRestanteAvant !== null &&
        quantitePesee >
        quantiteRestanteAvant
      ) {
        await transaction.rollback();

        return res.status(409).json({
          success: false,

          code:
            "QUANTITE_GLOBALE_DEPASSEE",

          message:
            "La quantité pesée dépasse la quantité restante de la prestation.",

          poids_net_kg:
            poidsNet,

          quantite_pesee:
            quantitePesee,

          unite:
            unitePrestation,

          quantite_restante:
            quantiteRestanteAvant,

          quantite_prevue:
            quantitePrevue,

          quantite_realisee:
            quantiteRealisee,

          camion_id:
            pesee.camion_id,

          quantite_restante_camion:
            quantiteRestanteCamion,
        });
      }
    }

    /* =====================================================
       UPDATE PESEE
    ===================================================== */

    await pesee.update(
      {
        poids_brut:
          poidsBrutNumber,

        poids_net:
          poidsNet,

        statut:
          "VALIDE",

        date_sortie:
          new Date(),

        /*
         * Le PDA peut avoir affecté la prestation
         * après l'entrée.
         */

        prestation_id:
          prestation?.id ||
          pesee.prestation_id ||
          null,
      },
      {
        transaction,
      }
    );

    /* =====================================================
       UPDATE TICKET
    ===================================================== */

    await ticket.update(
      {
        poids_brut:
          poidsBrutNumber,

        poids_net:
          poidsNet,

        statut:
          "VALIDE",

        date_sortie:
          new Date(),

        prestation_id:
          prestation?.id ||
          ticket.prestation_id ||
          null,

        /*
         * On conserve également les matricules
         * vérifiés à la sortie.
         */
        matricule_tracteur:
          matriculeTracteur,

        matricule_remorque:
          matriculeRemorque ||
          ticket.matricule_remorque ||
          null,
      },
      {
        transaction,
      }
    );

    /* =====================================================
       MISE A JOUR PRESTATION CAMION
    ===================================================== */

    if (
      prestation &&
      prestationCamion
    ) {

      const ancienneQuantiteCamion =
        Number(
          prestationCamion.quantite_realisee ||
          0
        );

      const nouvelleQuantiteCamion =
        ancienneQuantiteCamion +
        quantitePesee;

      const quantitePrevueCamionNumber =
        Number(
          prestationCamion.quantite_prevue ||
          0
        );

      const nouvelleQuantiteRestanteCamion =
        Math.max(
          quantitePrevueCamionNumber -
          nouvelleQuantiteCamion,
          0
        );

      /*
       * On conserve la quantité réellement pesée.
       */

      const prestationCamionUpdate = {
        quantite_realisee:
          nouvelleQuantiteCamion,

        updated_at:
          new Date(),
      };

      /*
       * Si la quantité réelle atteint ou dépasse
       * la quantité prévue, le camion est terminé.
       *
       * Cela permet également :
       *
       * 20 T prévue
       * 21 T pesée
       * => TERMINEE
       *
       * puisque 21 T reste dans la tolérance de 5 %.
       */

      if (
        nouvelleQuantiteCamion >=
        quantitePrevueCamionNumber
      ) {

        prestationCamionUpdate.statut =
          "TERMINEE";

        prestationCamionUpdate.date_fin =
          new Date();

      } else {

        prestationCamionUpdate.statut =
          "EN_COURS";

        prestationCamionUpdate.date_debut =
          prestationCamion.date_debut ||
          new Date();
      }

      await prestationCamion.update(
        prestationCamionUpdate,
        {
          transaction,
        }
      );

      console.log(
        "[PRESTATION CAMION] Quantité mise à jour :",
        {
          prestation_id:
            prestation.id,

          camion_id:
            pesee.camion_id,

          quantite_prevue:
            quantitePrevueCamionNumber,

          ancienne_quantite:
            ancienneQuantiteCamion,

          quantite_pesee:
            quantitePesee,

          nouvelle_quantite:
            nouvelleQuantiteCamion,

          quantite_restante:
            nouvelleQuantiteRestanteCamion,

          statut:
            prestationCamionUpdate.statut,
        }
      );
    }

    /* =====================================================
       MISE A JOUR PRESTATION GLOBALE
    ===================================================== */

    if (prestation) {

      const ancienneQuantite =
        Number(
          prestation.quantite_realisee ||
          0
        );

      const nouvelleQuantite =
        ancienneQuantite +
        quantitePesee;

      const quantitePrevue =
        prestation.quantite_prevue !== null &&
          prestation.quantite_prevue !== undefined
          ? Number(
            prestation.quantite_prevue
          )
          : null;

      /* ---------------------------------------------------
         QUANTITE RESTANTE
      --------------------------------------------------- */

      if (
        quantitePrevue !== null
      ) {

        quantiteRestante =
          Math.max(
            quantitePrevue -
            nouvelleQuantite,
            0
          );
      }

      /* ---------------------------------------------------
         SECURITE
      --------------------------------------------------- */

      if (
        quantitePrevue !== null &&
        nouvelleQuantite >
        quantitePrevue
      ) {
        await transaction.rollback();

        return res.status(409).json({
          success: false,

          message:
            "La quantité réalisée dépasserait la quantité prévue.",

          quantite_prevue:
            quantitePrevue,

          quantite_realisee:
            ancienneQuantite,

          quantite_pesee:
            quantitePesee,

          quantite_restante:
            quantiteRestante,

          unite:
            unitePrestation,
        });
      }

      /* ---------------------------------------------------
         UPDATE PRESTATION
      --------------------------------------------------- */

      const prestationUpdate = {
        quantite_realisee:
          nouvelleQuantite,

        updated_at:
          new Date(),
      };

      /* ---------------------------------------------------
         STATUT PRESTATION
      --------------------------------------------------- */

      if (
        quantitePrevue !== null &&
        quantiteRestante <= 0
      ) {

        prestationUpdate.statut =
          "TERMINEE";

        prestationUpdate.date_fin =
          new Date();

      } else {

        prestationUpdate.statut =
          "EN_COURS";

        prestationUpdate.date_debut =
          prestation.date_debut ||
          new Date();
      }

      await prestation.update(
        prestationUpdate,
        {
          transaction,
        }
      );

      console.log(
        "[PRESTATION] Quantité mise à jour :",
        {
          prestation_id:
            prestation.id,

          quantite_prevue:
            quantitePrevue,

          ancienne_quantite:
            ancienneQuantite,

          quantite_pesee:
            quantitePesee,

          unite:
            unitePrestation,

          nouvelle_quantite:
            nouvelleQuantite,

          quantite_restante:
            quantiteRestante,

          statut:
            prestationUpdate.statut,
        }
      );
    }

    /* =====================================================
       COMMIT
    ===================================================== */

    await transaction.commit();

    /* =====================================================
       RECHARGEMENT PESEE
    ===================================================== */

    const peseeComplete =
      await Pesee.findByPk(
        pesee.id,
        {
          include:
            getPeseeIncludes(),
        }
      );

    /* =====================================================
       RECHARGEMENT PRESTATION
    ===================================================== */

    const prestationComplete =
      prestation
        ? await Prestation.findByPk(
          prestation.id,
          {
            include: [
              {
                model: Ticket,
                as: "tickets",
                required: false,
              },

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
                model: PrestationFacturation,
                as: "facturations",
                required: false,
              },
            ],
          }
        )
        : null;

    /* =====================================================
       SOCKET
    ===================================================== */

    if (req.io) {

      req.io.emit(
        "pesee-sortie-enregistree",
        {
          pesee:
            peseeComplete,

          ticket,

          prestation:
            prestationComplete,

          prestation_id:
            prestation?.id ||
            null,

          poids_net:
            poidsNet,

          quantite_pesee:
            quantitePesee,

          unite:
            unitePrestation,

          quantite_restante:
            quantiteRestante,

          /*
           * Informations camion
           */

          camion_id:
            pesee.camion_id,

          quantite_prevue_camion:
            quantitePrevueCamion,

          quantite_realisee_camion:
            prestationCamion
              ? Number(
                prestationCamion.quantite_realisee ||
                0
              )
              : null,

          quantite_restante_camion:
            prestationCamion
              ? Math.max(
                Number(
                  prestationCamion.quantite_prevue ||
                  0
                ) -
                Number(
                  prestationCamion.quantite_realisee ||
                  0
                ),
                0
              )
              : null,

          tolerance_percent:
            prestationCamion
              ? 5
              : null,

          /*
           * Matricules vérifiés
           */

          matricule_tracteur:
            matriculeTracteur,

          matricule_remorque:
            matriculeRemorque ||
            null,
        }
      );

      req.io.emit(
        "weight-update",
        {
          pesee_id:
            pesee.id,

          poids:
            poidsNet,

          statut:
            "VALIDE",

          quantite_pesee:
            quantitePesee,

          unite:
            unitePrestation,

          quantite_restante:
            quantiteRestante,

          camion_id:
            pesee.camion_id,

          quantite_prevue_camion:
            quantitePrevueCamion,

          quantite_realisee_camion:
            prestationCamion
              ? Number(
                prestationCamion.quantite_realisee ||
                0
              )
              : null,

          quantite_restante_camion:
            prestationCamion
              ? Math.max(
                Number(
                  prestationCamion.quantite_prevue ||
                  0
                ) -
                Number(
                  prestationCamion.quantite_realisee ||
                  0
                ),
                0
              )
              : null,
        }
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Pesée de sortie enregistrée avec succès.",

      pesee:
        peseeComplete,

      ticket,

      prestation:
        prestationComplete,

      prestation_id:
        prestation?.id ||
        null,

      poids_tare:
        poidsTare,

      poids_brut:
        poidsBrutNumber,

      poids_net:
        poidsNet,

      quantite_pesee:
        quantitePesee,

      unite:
        unitePrestation,

      quantite_restante:
        quantiteRestante,

      /*
       * Matricules vérifiés
       */

      verification_matricules: {
        valide: true,

        tracteur_entree:
          pesee.immatriculation_tracteur_scanned,

        tracteur_sortie:
          matriculeTracteur,

        remorque_entree:
          pesee.immatriculation_remorque_scanned ||
          null,

        remorque_sortie:
          matriculeRemorque ||
          null,
      },

      /*
       * Informations camion
       */

      prestation_camion:
        prestationCamion
          ? {
            id:
              prestationCamion.id,

            prestation_id:
              prestationCamion.prestation_id,

            camion_id:
              prestationCamion.camion_id,

            quantite_prevue:
              Number(
                prestationCamion.quantite_prevue
              ),

            quantite_realisee:
              Number(
                prestationCamion.quantite_realisee
              ),

            quantite_restante:
              Math.max(
                Number(
                  prestationCamion.quantite_prevue
                ) -
                Number(
                  prestationCamion.quantite_realisee
                ),
                0
              ),

            statut:
              prestationCamion.statut,

            tolerance_percent:
              5,
          }
          : null,
    });

  } catch (error) {

    try {
      await transaction.rollback();
    } catch (_) { }

    console.error(
      "Erreur createSortie:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de l'enregistrement de la pesée de sortie.",

      error:
        error.message,
    });
  }
};
