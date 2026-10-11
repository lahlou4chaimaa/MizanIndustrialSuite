const { Camion, Pesee, Ticket } = require("../models");

function normalize(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().toUpperCase();
}

/**
 * GET /api/camions
 */
exports.getAllCamions = async (req, res) => {
  try {
    const camions = await Camion.findAll({
      include: [
        {
          model: Pesee,
          as: "pesees",
          required: false,
        },
        {
          model: Ticket,
          as: "tickets",
          required: false,
        },
      ],
      order: [["immatriculation", "ASC"]],
    });

    return res.json({
      success: true,
      camions,
    });
  } catch (error) {
    console.error("Erreur getAllCamions :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des camions.",
      error: error.message,
    });
  }
};

/**
 * GET /api/camions/:id
 */
exports.getCamionById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "ID camion invalide.",
      });
    }

    const camion = await Camion.findByPk(id, {
      include: [
        {
          model: Pesee,
          as: "pesees",
          required: false,
        },
        {
          model: Ticket,
          as: "tickets",
          required: false,
        },
      ],
    });

    if (!camion) {
      return res.status(404).json({
        success: false,
        message: "Camion introuvable.",
      });
    }

    return res.json({
      success: true,
      camion,
    });
  } catch (error) {
    console.error("Erreur getCamionById :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du camion.",
      error: error.message,
    });
  }
};

/**
 * POST /api/camions
 */
exports.createCamion = async (req, res) => {
  try {
    const immatriculation = normalize(
      req.body.immatriculation
    );

    const immatriculationRemorque = normalize(
      req.body.immatriculation_remorque
    );

    const marque =
      req.body.marque !== undefined &&
        req.body.marque !== null
        ? String(req.body.marque).trim()
        : null;

    const societeTransport =
      req.body.societe_transport !== undefined &&
        req.body.societe_transport !== null
        ? String(req.body.societe_transport).trim()
        : null;

    if (!immatriculation) {
      return res.status(400).json({
        success: false,
        message: "L'immatriculation du camion est obligatoire.",
      });
    }

    const existing = await Camion.findOne({
      where: {
        immatriculation,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Cette immatriculation existe déjà.",
        camion: existing,
      });
    }

    const camion = await Camion.create({
      immatriculation,
      immatriculation_remorque:
        immatriculationRemorque || null,
      marque: marque || null,
      societe_transport:
        societeTransport || null,
    });

    return res.status(201).json({
      success: true,
      message: "Camion créé avec succès.",
      camion,
    });
  } catch (error) {
    console.error("Erreur createCamion :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du camion.",
      error: error.message,
    });
  }
};

/**
 * PUT /api/camions/:id
 */
exports.updateCamion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "ID camion invalide.",
      });
    }

    const camion = await Camion.findByPk(id);

    if (!camion) {
      return res.status(404).json({
        success: false,
        message: "Camion introuvable.",
      });
    }

    const updates = {};

    if (req.body.immatriculation !== undefined) {
      const immatriculation = normalize(
        req.body.immatriculation
      );

      if (!immatriculation) {
        return res.status(400).json({
          success: false,
          message: "L'immatriculation est obligatoire.",
        });
      }

      const existing = await Camion.findOne({
        where: {
          immatriculation,
        },
      });

      if (
        existing &&
        existing.id !== camion.id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Cette immatriculation est déjà utilisée.",
        });
      }

      updates.immatriculation =
        immatriculation;
    }

    if (
      req.body.immatriculation_remorque !==
      undefined
    ) {
      const remorque = normalize(
        req.body.immatriculation_remorque
      );

      updates.immatriculation_remorque =
        remorque || null;
    }

    if (req.body.marque !== undefined) {
      updates.marque =
        String(req.body.marque).trim() ||
        null;
    }

    if (
      req.body.societe_transport !==
      undefined
    ) {
      updates.societe_transport =
        String(
          req.body.societe_transport
        ).trim() || null;
    }

    await camion.update(updates);

    return res.json({
      success: true,
      message: "Camion mis à jour avec succès.",
      camion,
    });
  } catch (error) {
    console.error("Erreur updateCamion :", error);

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la modification du camion.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/camions/:id
 */
exports.deleteCamion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "ID camion invalide.",
      });
    }

    const camion = await Camion.findByPk(id);

    if (!camion) {
      return res.status(404).json({
        success: false,
        message: "Camion introuvable.",
      });
    }

    /*
     * On évite de supprimer physiquement
     * un camion qui peut être lié à des pesées.
     */
    const peseeCount = await Pesee.count({
      where: {
        camion_id: id,
      },
    });

    if (peseeCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Ce camion possède déjà des pesées et ne peut pas être supprimé.",
      });
    }

    await camion.destroy();

    return res.json({
      success: true,
      message: "Camion supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur deleteCamion :", error);

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la suppression du camion.",
      error: error.message,
    });
  }
};
/**
 * POST /api/camions/ocr
 *
 * Reçoit une immatriculation détectée par OCR.
 * - Si le camion existe : retourne le camion existant.
 * - Sinon : crée automatiquement le camion.
 */
exports.createOrGetCamionFromOCR = async (req, res) => {
  try {
    const immatriculation = String(
      req.body.immatriculation || ""
    ).trim();

    if (!immatriculation) {
      return res.status(400).json({
        success: false,
        message: "L'immatriculation détectée est obligatoire.",
      });
    }

    // Recherche exacte de la matricule OCR
    const existing = await Camion.findOne({
      where: {
        immatriculation,
      },
    });

    // Camion déjà enregistré
    if (existing) {
      return res.json({
        success: true,
        created: false,
        message: "Camion déjà enregistré.",
        camion: existing,
      });
    }

    // Nouveau camion détecté par OCR
    const camion = await Camion.create({
      immatriculation,
      immatriculation_remorque: null,
      marque: null,
      societe_transport: null,
      date_enregistrement: new Date(),
    });

    return res.status(201).json({
      success: true,
      created: true,
      message: "Camion détecté et enregistré automatiquement.",
      camion,
    });
  } catch (error) {
    console.error(
      "Erreur createOrGetCamionFromOCR :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de l'enregistrement automatique du camion.",
      error: error.message,
    });
  }
};