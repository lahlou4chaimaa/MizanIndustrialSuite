const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// PDF
router.get(
    "/pesee/:peseeId/pdf",
    ticketController.generatePdfByPesee
);

// Ticket par pesée
router.get(
    "/pesee/:peseeId",
    ticketController.getByPesee
);

// Ticket par QR — IMPORTANT : avant /:id
router.get(
    "/qr/:qrCode",
    ticketController.getByQrCode
);

// Tous les tickets
router.get(
    "/",
    ticketController.getAll
);

// Ticket par ID
router.get(
    "/:id",
    ticketController.getById
);

module.exports = router;