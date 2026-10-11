// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${suffix}${path.extname(file.originalname)}`);
    },
});

function fileFilter(req, file, cb) {
    const typesAutorises = /jpeg|jpg|png/;
    const extOk = typesAutorises.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = typesAutorises.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Seules les images JPEG/PNG sont acceptées.'));
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });