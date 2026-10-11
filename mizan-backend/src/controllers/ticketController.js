const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const {
    Ticket,
    Pesee,
    Camion,
    Chauffeur,
    Marchandise,
    Prestation,
} = require("../models");

/* ============================================================
   CONFIGURATION PDF
============================================================ */

// 80 mm = 226.77 points
const PAGE_WIDTH = 226.77;

// Ticket compact : environ 200 mm de hauteur
const PAGE_HEIGHT = 570;

const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;


/* ============================================================
   COULEURS
============================================================ */

const COLORS = {
    blue: "#0B5E8E",
    darkBlue: "#083B5C",
    text: "#202020",
    gray: "#666666",
    lightGray: "#E5E5E5",
    white: "#FFFFFF",
    black: "#000000",
};


/* ============================================================
   POLICES
============================================================ */

const FONT_DIR = path.join(__dirname, "../assets/fonts");

const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

// Police dédiée pour la lettre arabe des plaques marocaines.
// DejaVuSans NE COUVRE PAS le bloc Unicode arabe (U+0600–U+06FF) :
// même reçue correctement, la lettre ne peut pas s'afficher avec
// DejaVuSans. Il faut une police arabe dédiée (Noto Naskh Arabic,
// Amiri, etc.) placée ici : assets/fonts/NotoNaskhArabic-Regular.ttf
const FONT_ARABIC = path.join(FONT_DIR, "NotoNaskhArabic-Regular.ttf");

function isUsableFontFile(filePath) {
    try {
        const stats = fs.statSync(filePath);

        // Un .ttf valide fait généralement plusieurs dizaines/centaines
        // de Ko. En dessous de 1 Ko, c'est presque toujours un fichier
        // vide ou corrompu (c'est ce qui causait "73215 b‚€" avant).
        return stats.isFile() && stats.size > 1024;
    } catch {
        return false;
    }
}

/**
 * Vérifie que le fichier de police arabe est réellement chargeable
 * ET qu'il contient un glyphe pour une lettre arabe de test (ب,
 * U+0628 — l'une des lettres utilisées sur les plaques marocaines).
 *
 * Un fichier .ttf peut faire plusieurs Ko (donc passer
 * isUsableFontFile) tout en étant tronqué/corrompu ou en étant une
 * police qui ne couvre pas l'arabe. C'est ce genre de fichier
 * "presque valide" qui produit des glyphes n'importe quoi au rendu
 * (ex. "b" collé aux chiffres) au lieu d'une erreur claire.
 */
function isUsableArabicFont(filePath) {
    if (!isUsableFontFile(filePath)) {
        return false;
    }

    try {
        // pdfkit s'appuie sur fontkit pour parser les .ttf/.otf ;
        // ce module est donc déjà présent comme dépendance.
        const fontkit = require("fontkit");

        const font = fontkit.openSync(filePath);

        // U+0628 = ب (lettre "ba"), présente sur les plaques
        // marocaines. glyphForCodePoint renvoie le glyphe ".notdef"
        // (id 0) si le caractère n'est pas couvert par la police.
        const glyph = font.glyphForCodePoint(0x0628);

        return Boolean(glyph) && glyph.id !== 0;
    } catch (err) {
        console.warn(
            "[TICKET PDF] Impossible de charger/valider la police arabe (" +
            filePath +
            ") :",
            err.message
        );

        return false;
    }
}

const HAS_UNICODE_FONT = isUsableFontFile(FONT_REGULAR);
const HAS_BOLD_FONT = isUsableFontFile(FONT_BOLD);
const HAS_ARABIC_FONT = isUsableArabicFont(FONT_ARABIC);

if (!HAS_ARABIC_FONT) {
    console.warn(
        "[TICKET PDF] Police arabe absente, invalide, ou ne couvrant " +
        "pas l'arabe (" +
        FONT_ARABIC +
        "). La lettre arabe des plaques ne pourra pas s'afficher " +
        "correctement tant qu'un vrai fichier .ttf couvrant l'arabe " +
        "n'est pas fourni."
    );
}


/* ============================================================
   HELPERS
============================================================ */

function safe(value, fallback = "") {
    if (value === undefined || value === null) {
        return fallback;
    }

    return String(value);
}

/**
 * Détecte si une chaîne contient du texte arabe (bloc Unicode
 * arabe de base + présentation arabe).
 */
function containsArabic(value) {
    return /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
        String(value || "")
    );
}

/**
 * Tentative de réparation d'un mojibake classique :
 * une chaîne UTF-8 (ex. la lettre arabe, 2 octets) qui a été
 * stockée/relue en interprétant ces octets comme du Latin-1 /
 * Windows-1252 se transforme en 2-3 caractères "parasites"
 * (Ã˜..., â€..., Ò, `, „, ‚, etc).
 *
 * On tente l'aller-retour Latin1 -> UTF8 : si le résultat contient
 * un vrai caractère arabe après coup, on le garde. Sinon on
 * renvoie la valeur d'origine.
 *
 * IMPORTANT : ceci est un filet de sécurité, pas une solution.
 * Le vrai correctif est de forcer utf8mb4 sur la connexion et
 * les colonnes concernées (voir config/database.js).
 */
function repairMojibake(value) {
    if (!value) {
        return value;
    }

    const original = String(value);

    if (containsArabic(original)) {
        // Déjà propre.
        return original;
    }

    try {
        const repaired = Buffer.from(original, "latin1").toString(
            "utf8"
        );

        if (containsArabic(repaired)) {
            return repaired;
        }
    } catch {
        // ignore, on retombe sur la valeur d'origine
    }

    return original;
}

/**
 * Formate une plaque marocaine et la sépare en 3 segments :
 * numéro de série | lettre (arabe ou translittérée) | code région
 *
 * Exemples reçus possibles :
 *   "73215 ب 8"
 *   "73215 | ب | 8"
 *   "73215 b 8"        (lettre déjà translittérée par l'OCR)
 *
 * Retourne { left, letter, right, isArabicLetter }
 */
function parsePlate(value) {
    if (!value) {
        return {
            left: "-",
            letter: "",
            right: "",
            isArabicLetter: false,
        };
    }

    let plate = repairMojibake(value);

    plate = plate
        .normalize("NFKC")
        .replace(/[|｜]/g, " ")
        .replace(/[‚„""'']/g, "")
        .replace(/[€]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const parts = plate.split(" ").filter(Boolean);

    if (parts.length >= 3) {
        const letter = parts[1];

        return {
            left: parts[0],
            letter,
            right: parts[2],
            isArabicLetter: containsArabic(letter),
        };
    }

    // Format non standard (OCR incomplet, saisie manuelle libre...) :
    // on affiche tel quel plutôt que d'inventer un découpage.
    return {
        left: plate,
        letter: "",
        right: "",
        isArabicLetter: false,
    };
}

/**
 * Version "texte simple" utilisée pour les logs / champs qui
 * n'ont pas besoin d'un rendu multi-police (ex. valeur brute
 * réinjectée ailleurs dans le document).
 */
function formatPlateForPdf(value) {
    const { left, letter, right } = parsePlate(value);

    if (!letter) {
        return left;
    }

    return `${left} ${letter} ${right}`;
}

/**
 * Formatage manuel du poids.
 *
 * 11443     -> 11 443
 * 11443.00  -> 11 443
 * 125000    -> 125 000
 */
function formatWeight(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return safe(value, "-");
    }

    const rounded = Math.round(number);

    return String(rounded).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        " "
    );
}

/**
 * Numéro de ticket propre.
 */
function generateTicketNumber() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const random = Math.random()
        .toString(16)
        .substring(2, 8)
        .toUpperCase();

    return `T-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

/**
 * QR unique.
 */
function generateQrCode() {
    const random = Math.random()
        .toString(16)
        .substring(2, 10)
        .toUpperCase();

    return `TICKET-${Date.now()}-${random}`;
}

/**
 * Police régulière.
 */
function useRegularFont(doc) {
    if (HAS_UNICODE_FONT) {
        doc.font(FONT_REGULAR);
    } else {
        doc.font("Helvetica");
    }

    return doc;
}

/**
 * Police bold.
 */
function useBoldFont(doc) {
    if (HAS_BOLD_FONT) {
        doc.font(FONT_BOLD);
    } else {
        doc.font("Helvetica-Bold");
    }

    return doc;
}

/**
 * Police arabe (pour la lettre de la plaque uniquement).
 * Retombe sur la police régulière si aucune police arabe
 * valide n'est disponible (mieux vaut un caractère manquant
 * visible que planter la génération du PDF).
 */
function useArabicFont(doc) {
    if (HAS_ARABIC_FONT) {
        doc.font(FONT_ARABIC);
    } else {
        useBoldFont(doc);
    }

    return doc;
}

/**
 * Dessine une ligne séparatrice.
 */
function separator(doc, y) {
    doc
        .strokeColor(COLORS.lightGray)
        .lineWidth(0.6)
        .moveTo(MARGIN, y)
        .lineTo(PAGE_WIDTH - MARGIN, y)
        .stroke();
}

/**
 * Petit label + valeur sur une seule ligne.
 */
function drawRow(
    doc,
    label,
    value,
    y,
    labelWidth = 70
) {
    useRegularFont(doc);

    doc
        .fontSize(6.7)
        .fillColor(COLORS.gray)
        .text(
            label,
            MARGIN,
            y,
            {
                width: labelWidth,
                lineBreak: false,
            }
        );

    useBoldFont(doc);

    doc
        .fontSize(7)
        .fillColor(COLORS.text)
        .text(
            safe(value, "-"),
            MARGIN + labelWidth,
            y,
            {
                width: CONTENT_WIDTH - labelWidth,
                align: "right",
                lineBreak: false,
            }
        );
}

/**
 * Dessine la matricule en séparant explicitement les 3 segments
 * (numéro / lettre / numéro) pour pouvoir appliquer la police
 * arabe UNIQUEMENT sur la lettre, et la police latine sur les
 * chiffres — PDFKit ne supporte pas le changement de police au
 * milieu d'un seul appel à .text(), donc on calcule manuellement
 * la largeur de chaque segment pour centrer le tout.
 */
function drawPlate(doc, rawPlate, y) {
    const { left, letter, right, isArabicLetter } =
        parsePlate(rawPlate);

    const fontSize = 12;
    const gap = 6;

    useBoldFont(doc);
    doc.fontSize(fontSize);
    const leftWidth = doc.widthOfString(left);

    let letterWidth = 0;
    if (letter) {
        if (isArabicLetter) {
            useArabicFont(doc);
        } else {
            useBoldFont(doc);
        }
        doc.fontSize(fontSize);
        letterWidth = doc.widthOfString(letter);
    }

    let rightWidth = 0;
    if (right) {
        useBoldFont(doc);
        doc.fontSize(fontSize);
        rightWidth = doc.widthOfString(right);
    }

    const segmentsCount = [left, letter, right].filter(
        Boolean
    ).length;

    const totalWidth =
        leftWidth +
        letterWidth +
        rightWidth +
        gap * Math.max(segmentsCount - 1, 0);

    let x = MARGIN + (CONTENT_WIDTH - totalWidth) / 2;

    doc.fillColor(COLORS.darkBlue);

    useBoldFont(doc);
    doc.fontSize(fontSize);
    doc.text(left, x, y, { lineBreak: false });
    x += leftWidth;

    if (letter) {
        x += gap;

        if (isArabicLetter) {
            useArabicFont(doc);
        } else {
            useBoldFont(doc);
        }

        doc.fontSize(fontSize);
        doc.text(letter, x, y, { lineBreak: false });
        x += letterWidth;
    }

    if (right) {
        x += gap;

        useBoldFont(doc);
        doc.fontSize(fontSize);
        doc.text(right, x, y, { lineBreak: false });
    }

    return y + 17;
}


/* ============================================================
   INCLUDES
============================================================ */

function getTicketIncludes() {
    return [
        {
            model: Pesee,
            as: "pesee",
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
    ];
}


/* ============================================================
   GET TICKET PAR QR
============================================================ */

exports.getByQrCode = async (req, res) => {
    try {
        const { qrCode } = req.params;

        if (!qrCode) {
            return res.status(400).json({
                success: false,
                message: "Le QR code est obligatoire.",
            });
        }

        const ticket = await Ticket.findOne({
            where: {
                qr_code: qrCode,
            },
            include: getTicketIncludes(),
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket introuvable.",
            });
        }

        return res.json({
            success: true,

            ticket: {
                id: ticket.id,

                numero_ticket:
                    ticket.numero_ticket,

                qr_code:
                    ticket.qr_code,

                statut:
                    ticket.statut,

                matricule_tracteur:
                    ticket.matricule_tracteur,

                matricule_remorque:
                    ticket.matricule_remorque,

                nom_chauffeur:
                    ticket.nom_chauffeur ||
                    ticket.chauffeur?.nom ||
                    null,

                prenom_chauffeur:
                    ticket.prenom_chauffeur ||
                    ticket.chauffeur?.prenom ||
                    null,

                cin_chauffeur:
                    ticket.cin_chauffeur ||
                    ticket.chauffeur?.cin ||
                    null,

                poids_tare:
                    ticket.poids_tare,

                poids_brut:
                    ticket.poids_brut,

                poids_net:
                    ticket.poids_net,

                date_entree:
                    ticket.date_entree,

                date_sortie:
                    ticket.date_sortie,

                pesee:
                    ticket.pesee || null,

                camion:
                    ticket.camion || null,

                chauffeur:
                    ticket.chauffeur || null,

                marchandise:
                    ticket.marchandise || null,
            },
        });
    } catch (error) {
        console.error(
            "[TICKET QR] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération du ticket.",
            error: error.message,
        });
    }
};


/* ============================================================
   GET TICKET PAR PESEE
============================================================ */

exports.getByPesee = async (req, res) => {
    try {
        const { peseeId } = req.params;

        const ticket = await Ticket.findOne({
            where: {
                pesee_id: peseeId,
            },
            include: getTicketIncludes(),
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message:
                    "Aucun ticket trouvé pour cette pesée.",
            });
        }

        return res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error(
            "[TICKET PESEE] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération du ticket.",
            error: error.message,
        });
    }
};


/* ============================================================
   GET TICKET PAR ID
============================================================ */

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findByPk(id, {
            include: getTicketIncludes(),
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket introuvable.",
            });
        }

        return res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error(
            "[TICKET ID] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération du ticket.",
            error: error.message,
        });
    }
};


/* ============================================================
   GET TOUS LES TICKETS
============================================================ */

exports.getAll = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            include: getTicketIncludes(),
            order: [
                ["created_at", "DESC"],
            ],
        });

        return res.json({
            success: true,
            count: tickets.length,
            tickets,
        });
    } catch (error) {
        console.error(
            "[TICKETS] Erreur :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération des tickets.",
            error: error.message,
        });
    }
};


/* ============================================================
   GENERATION PDF PAR PESEE
============================================================ */

exports.generatePdfByPesee = async (req, res) => {
    try {
        const { peseeId } = req.params;

        if (!peseeId) {
            return res.status(400).json({
                success: false,
                message: "peseeId est obligatoire.",
            });
        }

        /* ----------------------------------------------------
           RECUPERATION TICKET
        ---------------------------------------------------- */

        const ticket = await Ticket.findOne({
            where: {
                pesee_id: peseeId,
            },
            include: getTicketIncludes(),
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message:
                    "Aucun ticket trouvé pour cette pesée.",
            });
        }


        /* ----------------------------------------------------
           DONNEES
        ---------------------------------------------------- */

        const camion = ticket.camion;
        const chauffeur = ticket.chauffeur;
        const marchandise = ticket.marchandise;
        const pesee = ticket.pesee;


        const matriculeTracteurRaw =
            ticket.matricule_tracteur ||
            camion?.matricule_tracteur ||
            camion?.matricule ||
            "-";

        const matriculeRemorque =
            ticket.matricule_remorque ||
            camion?.matricule_remorque ||
            "-";


        const nomChauffeur =
            ticket.nom_chauffeur ||
            chauffeur?.nom ||
            "-";

        const prenomChauffeur =
            ticket.prenom_chauffeur ||
            chauffeur?.prenom ||
            "-";

        const cinChauffeur =
            ticket.cin_chauffeur ||
            chauffeur?.cin ||
            "-";


        const poidsTare =
            ticket.poids_tare ??
            pesee?.poids_entree ??
            0;

        const poidsBrut =
            ticket.poids_brut ??
            null;

        const poidsNet =
            ticket.poids_net ??
            null;


        /* ----------------------------------------------------
           QR
        ---------------------------------------------------- */

        const qrValue =
            ticket.qr_code ||
            generateQrCode();

        const qrBuffer =
            await QRCode.toBuffer(
                qrValue,
                {
                    type: "png",
                    width: 300,
                    margin: 1,
                    errorCorrectionLevel: "M",
                }
            );


        /* ----------------------------------------------------
           PDF
        ---------------------------------------------------- */

        const doc = new PDFDocument({
            size: [
                PAGE_WIDTH,
                PAGE_HEIGHT,
            ],

            margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            },

            autoFirstPage: true,

            bufferPages: false,
        });


        /* ----------------------------------------------------
           HEADERS HTTP
        ---------------------------------------------------- */

        const safeFileName =
            String(
                ticket.numero_ticket ||
                `ticket-${peseeId}`
            )
                .replace(/[^a-zA-Z0-9_-]/g, "_");

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${safeFileName}.pdf"`
        );


        doc.pipe(res);


        /* ====================================================
           HEADER
        ==================================================== */

        let y = 12;

        useBoldFont(doc);

        doc
            .fontSize(14)
            .fillColor(COLORS.darkBlue)
            .text(
                "MIZAN",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 17;

        useRegularFont(doc);

        doc
            .fontSize(6.5)
            .fillColor(COLORS.gray)
            .text(
                "TICKET DE PESÉE",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 12;

        separator(doc, y);

        y += 9;


        /* ====================================================
           NUMERO TICKET
        ==================================================== */

        useRegularFont(doc);

        doc
            .fontSize(6.5)
            .fillColor(COLORS.gray)
            .text(
                "N° TICKET",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 9;

        useBoldFont(doc);

        doc
            .fontSize(8.5)
            .fillColor(COLORS.text)
            .text(
                safe(ticket.numero_ticket, "-"),
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 14;

        separator(doc, y);

        y += 9;


        /* ====================================================
           VEHICULE
        ==================================================== */

        useBoldFont(doc);

        doc
            .fontSize(7)
            .fillColor(COLORS.blue)
            .text(
                "VÉHICULE",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "left",
                    lineBreak: false,
                }
            );

        y += 12;


        // Matricule tracteur
        useRegularFont(doc);

        doc
            .fontSize(6.3)
            .fillColor(COLORS.gray)
            .text(
                "TRACTEUR",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 9;

        y = drawPlate(
            doc,
            matriculeTracteurRaw,
            y
        );

        y += 2;


        // Remorque
        useRegularFont(doc);

        doc
            .fontSize(6.3)
            .fillColor(COLORS.gray)
            .text(
                "REMORQUE",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 9;

        useBoldFont(doc);

        doc
            .fontSize(8.5)
            .fillColor(COLORS.text)
            .text(
                safe(matriculeRemorque, "-"),
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 15;

        separator(doc, y);

        y += 9;


        /* ====================================================
           CHAUFFEUR
        ==================================================== */

        useBoldFont(doc);

        doc
            .fontSize(7)
            .fillColor(COLORS.blue)
            .text(
                "CHAUFFEUR",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    lineBreak: false,
                }
            );

        y += 11;

        drawRow(
            doc,
            "Nom",
            nomChauffeur,
            y
        );

        y += 10;

        drawRow(
            doc,
            "Prénom",
            prenomChauffeur,
            y
        );

        y += 10;

        drawRow(
            doc,
            "CIN",
            cinChauffeur,
            y
        );

        y += 15;

        separator(doc, y);

        y += 9;


        /* ====================================================
           MARCHANDISE
        ==================================================== */

        useBoldFont(doc);

        doc
            .fontSize(7)
            .fillColor(COLORS.blue)
            .text(
                "MARCHANDISE",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    lineBreak: false,
                }
            );

        y += 11;

        const marchandiseName =
            marchandise?.nom ||
            marchandise?.designation ||
            marchandise?.libelle ||
            "-";

        drawRow(
            doc,
            "Produit",
            marchandiseName,
            y
        );

        y += 15;

        separator(doc, y);

        y += 9;


        /* ====================================================
           POIDS
        ==================================================== */

        useBoldFont(doc);

        doc
            .fontSize(7)
            .fillColor(COLORS.blue)
            .text(
                "PESÉE",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    lineBreak: false,
                }
            );

        y += 12;

        drawRow(
            doc,
            "Tare",
            `${formatWeight(poidsTare)} kg`,
            y
        );

        y += 11;

        drawRow(
            doc,
            "Brut",
            poidsBrut !== null
                ? `${formatWeight(poidsBrut)} kg`
                : "-",
            y
        );

        y += 11;

        drawRow(
            doc,
            "Net",
            poidsNet !== null
                ? `${formatWeight(poidsNet)} kg`
                : "-",
            y
        );

        y += 15;

        separator(doc, y);

        y += 10;


        /* ====================================================
           QR CODE
        ==================================================== */

        const QR_SIZE = 65;

        // Centre horizontalement
        const qrX =
            (PAGE_WIDTH - QR_SIZE) / 2;

        doc.image(
            qrBuffer,
            qrX,
            y,
            {
                width: QR_SIZE,
                height: QR_SIZE,
            }
        );

        y += QR_SIZE + 6;


        /* ====================================================
           QR VALUE
        ==================================================== */

        useRegularFont(doc);

        doc
            .fontSize(5.5)
            .fillColor(COLORS.gray)
            .text(
                safe(qrValue, "-"),
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 12;


        /* ====================================================
           DATE
        ==================================================== */

        const dateValue =
            ticket.date_entree ||
            pesee?.created_at ||
            ticket.created_at ||
            new Date();

        let dateText = "-";

        try {
            dateText = new Date(
                dateValue
            ).toLocaleString(
                "fr-FR",
                {
                    dateStyle: "short",
                    timeStyle: "short",
                }
            );
        } catch {
            dateText = safe(dateValue, "-");
        }

        useRegularFont(doc);

        doc
            .fontSize(5.8)
            .fillColor(COLORS.gray)
            .text(
                `Entrée : ${dateText}`,
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );

        y += 10;


        /* ====================================================
           FOOTER
        ==================================================== */

        separator(doc, y);

        y += 7;

        useRegularFont(doc);

        doc
            .fontSize(5.5)
            .fillColor(COLORS.gray)
            .text(
                "Document généré automatiquement par MIZAN",
                MARGIN,
                y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                    lineBreak: false,
                }
            );


        /* ====================================================
           FIN
        ==================================================== */

        doc.end();

    } catch (error) {
        console.error(
            "[TICKET PDF] Erreur :",
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message:
                    "Erreur lors de la génération du ticket PDF.",
                error: error.message,
            });
        }

        res.end();
    }
};