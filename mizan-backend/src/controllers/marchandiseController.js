const { Marchandise } = require("../models");

function normalize(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

/**
 * GET /api/marchandises
 */
exports.getAll = async (req, res) => {
    try {
        const marchandises = await Marchandise.findAll({
            where: {
                actif: true,
            },
            order: [["nom", "ASC"]],
        });

        return res.json({
            success: true,
            marchandises,
        });
    } catch (error) {
        console.error("Erreur getAll marchandises :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des marchandises.",
            error: error.message,
        });
    }
};

/**
 * GET /api/marchandises/:id
 */
exports.getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const marchandise = await Marchandise.findByPk(id);

        if (!marchandise) {
            return res.status(404).json({
                success: false,
                message: "Marchandise introuvable.",
            });
        }

        return res.json({
            success: true,
            marchandise,
        });
    } catch (error) {
        console.error("Erreur getById marchandise :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la marchandise.",
            error: error.message,
        });
    }
};

/**
 * POST /api/marchandises
 */
exports.create = async (req, res) => {
    try {
        const code = normalize(req.body.code);
        const nom = normalize(req.body.nom);
        const description = normalize(req.body.description);
        const unite = normalize(req.body.unite) || "kg";

        if (!code || !nom) {
            return res.status(400).json({
                success: false,
                message: "Le code et le nom sont obligatoires.",
            });
        }

        const existing = await Marchandise.findOne({
            where: { code },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Une marchandise avec ce code existe déjà.",
            });
        }

        const marchandise = await Marchandise.create({
            code,
            nom,
            description: description || null,
            unite,
            actif: true,
        });

        return res.status(201).json({
            success: true,
            message: "Marchandise créée.",
            marchandise,
        });
    } catch (error) {
        console.error("Erreur create marchandise :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la marchandise.",
            error: error.message,
        });
    }
};

/**
 * PUT /api/marchandises/:id
 */
exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const marchandise = await Marchandise.findByPk(id);

        if (!marchandise) {
            return res.status(404).json({
                success: false,
                message: "Marchandise introuvable.",
            });
        }

        const updates = {};

        if (req.body.code !== undefined) {
            updates.code = normalize(req.body.code);
        }

        if (req.body.nom !== undefined) {
            updates.nom = normalize(req.body.nom);
        }

        if (req.body.description !== undefined) {
            updates.description = normalize(req.body.description) || null;
        }

        if (req.body.unite !== undefined) {
            updates.unite = normalize(req.body.unite);
        }

        if (req.body.actif !== undefined) {
            updates.actif = Boolean(req.body.actif);
        }

        await marchandise.update(updates);

        return res.json({
            success: true,
            message: "Marchandise mise à jour.",
            marchandise,
        });
    } catch (error) {
        console.error("Erreur update marchandise :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la modification de la marchandise.",
            error: error.message,
        });
    }
};

/**
 * DELETE /api/marchandises/:id
 *
 * Suppression logique.
 */
exports.delete = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const marchandise = await Marchandise.findByPk(id);

        if (!marchandise) {
            return res.status(404).json({
                success: false,
                message: "Marchandise introuvable.",
            });
        }

        await marchandise.update({
            actif: false,
        });

        return res.json({
            success: true,
            message: "Marchandise désactivée.",
        });
    } catch (error) {
        console.error("Erreur delete marchandise :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la désactivation.",
            error: error.message,
        });
    }
};