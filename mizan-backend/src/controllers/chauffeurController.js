const crypto = require("crypto");
const { Chauffeur } = require("../models");

/**
 * Génère un code QR unique.
 * Le QR du chauffeur est stocké dans chauffeurs.code_qr.
 */
function generateQrCode() {
  return `CH-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Normalisation simple.
 */
function normalize(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

/**
 * GET /api/chauffeurs
 */
exports.getAllChauffeurs = async (req, res) => {
  try {
    const chauffeurs = await Chauffeur.findAll({
      order: [
        ["nom", "ASC"],
        ["prenom", "ASC"],
      ],
    });

    return res.json({
      success: true,
      chauffeurs,
    });
  } catch (error) {
    console.error("Erreur getAllChauffeurs :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des chauffeurs.",
      error: error.message,
    });
  }
};

/**
 * GET /api/chauffeurs/:id
 */
exports.getChauffeurById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "ID chauffeur invalide.",
      });
    }

    const chauffeur = await Chauffeur.findByPk(id);

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur introuvable.",
      });
    }

    return res.json({
      success: true,
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur getChauffeurById :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * GET /api/chauffeurs/qr/:code_qr
 */
exports.getChauffeurByQr = async (req, res) => {
  try {
    const codeQr = normalize(req.params.code_qr);

    if (!codeQr) {
      return res.status(400).json({
        success: false,
        message: "Code QR obligatoire.",
      });
    }

    const chauffeur = await Chauffeur.findOne({
      where: {
        code_qr: codeQr,
      },
    });

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Aucun chauffeur associé à ce QR.",
        code_qr: codeQr,
      });
    }

    return res.json({
      success: true,
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur getChauffeurByQr :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * POST /api/chauffeurs
 *
 * Création classique.
 */
exports.createChauffeur = async (req, res) => {
  try {
    const nom = normalize(req.body.nom);
    const prenom = normalize(req.body.prenom);
    const cin = normalize(req.body.cin);
    const codeQr = normalize(req.body.code_qr) || generateQrCode();

    if (!nom || !prenom || !cin) {
      return res.status(400).json({
        success: false,
        message: "Nom, prénom et CIN sont obligatoires.",
      });
    }

    const existingCin = await Chauffeur.findOne({
      where: { cin },
    });

    if (existingCin) {
      return res.status(409).json({
        success: false,
        message: "Un chauffeur avec cette CIN existe déjà.",
        chauffeur: existingCin,
      });
    }

    const existingQr = await Chauffeur.findOne({
      where: { code_qr: codeQr },
    });

    if (existingQr) {
      return res.status(409).json({
        success: false,
        message: "Ce code QR est déjà utilisé.",
      });
    }

    const chauffeur = await Chauffeur.create({
      nom,
      prenom,
      cin,
      code_qr: codeQr,
      photo_reference_url: null,
      actif: true,
    });

    return res.status(201).json({
      success: true,
      message: "Chauffeur créé avec succès.",
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur createChauffeur :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * POST /api/chauffeurs/enregistrer-avec-qr
 *
 * Utilisé lorsque le QR scanné n'existe pas encore.
 */
exports.enregistrerAvecQrScanne = async (req, res) => {
  try {
    const codeQr = normalize(req.body.code_qr);
    const nom = normalize(req.body.nom);
    const prenom = normalize(req.body.prenom);
    const cin = normalize(req.body.cin);

    if (!codeQr) {
      return res.status(400).json({
        success: false,
        message: "Le code QR est obligatoire.",
      });
    }

    if (!nom || !prenom || !cin) {
      return res.status(400).json({
        success: false,
        message: "Nom, prénom et CIN sont obligatoires.",
      });
    }

    const chauffeurQr = await Chauffeur.findOne({
      where: {
        code_qr: codeQr,
      },
    });

    if (chauffeurQr) {
      return res.status(409).json({
        success: false,
        message: "Ce QR est déjà enregistré.",
        chauffeur: chauffeurQr,
      });
    }

    const chauffeurCin = await Chauffeur.findOne({
      where: {
        cin,
      },
    });

    if (chauffeurCin) {
      return res.status(409).json({
        success: false,
        message: "Cette CIN est déjà associée à un chauffeur.",
        chauffeur: chauffeurCin,
      });
    }

    const chauffeur = await Chauffeur.create({
      nom,
      prenom,
      cin,
      code_qr: codeQr,
      photo_reference_url: null,
      actif: true,
    });

    return res.status(201).json({
      success: true,
      message: "Chauffeur enregistré avec succès.",
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur enregistrerAvecQrScanne :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * PUT /api/chauffeurs/:id
 */
exports.updateChauffeur = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "ID chauffeur invalide.",
      });
    }

    const chauffeur = await Chauffeur.findByPk(id);

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur introuvable.",
      });
    }

    const updates = {};

    if (req.body.nom !== undefined) {
      updates.nom = normalize(req.body.nom);
    }

    if (req.body.prenom !== undefined) {
      updates.prenom = normalize(req.body.prenom);
    }

    if (req.body.cin !== undefined) {
      const cin = normalize(req.body.cin);

      const existing = await Chauffeur.findOne({
        where: { cin },
      });

      if (existing && existing.id !== chauffeur.id) {
        return res.status(409).json({
          success: false,
          message: "Cette CIN est déjà utilisée.",
        });
      }

      updates.cin = cin;
    }

    if (req.body.actif !== undefined) {
      updates.actif = Boolean(req.body.actif);
    }

    await chauffeur.update(updates);

    return res.json({
      success: true,
      message: "Chauffeur mis à jour.",
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur updateChauffeur :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/chauffeurs/:id
 *
 * Suppression logique.
 */
exports.deleteChauffeur = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const chauffeur = await Chauffeur.findByPk(id);

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur introuvable.",
      });
    }

    await chauffeur.update({
      actif: false,
    });

    return res.json({
      success: true,
      message: "Chauffeur désactivé avec succès.",
    });
  } catch (error) {
    console.error("Erreur deleteChauffeur :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du chauffeur.",
      error: error.message,
    });
  }
};

/**
 * POST /api/chauffeurs/:id/photo-reference
 *
 * req.file vient de multer.
 */
exports.uploaderPhotoReference = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const chauffeur = await Chauffeur.findByPk(id);

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur introuvable.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune photo reçue.",
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await chauffeur.update({
      photo_reference_url: photoUrl,
    });

    return res.json({
      success: true,
      message: "Photo de référence enregistrée.",
      photo_reference_url: photoUrl,
      chauffeur,
    });
  } catch (error) {
    console.error("Erreur uploaderPhotoReference :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la photo.",
      error: error.message,
    });
  }
};