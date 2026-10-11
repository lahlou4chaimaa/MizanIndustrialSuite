const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;




// /**
//  * ============================================================
//  * ROUTES AUTH — Pont-Bascule Marsa Maroc
//  * Intégration avec ton projet existant (PostgreSQL + Socket.IO)
//  * ============================================================
//  */

// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const db = require('../../config/db'); // <-- ton fichier db existant

// // ─── CONFIG ───
// const JWT_ACCESS_EXPIRY = '15m';
// const JWT_REFRESH_EXPIRY = '7d';
// const PIN_ATTEMPTS_MAX = 5;
// const PIN_WINDOW_MINUTES = 15;
// const SESSION_INACTIVITY_MIN = 5;

// // Stockage temporaire challenges (en prod: Redis)
// const challenges = new Map();

// // ─── MIDDLEWARES AUXILIAIRES ───

// // Rate limiting PIN personnalisé (par employé + IP)
// async function checkPinRateLimit(employe_id, ip) {
//   const result = await db.query(
//     `SELECT COUNT(*) as count FROM pin_attempts
//      WHERE (employe_id = $1 OR ip = $2)
//      AND created_at > NOW() - INTERVAL '${PIN_WINDOW_MINUTES} minutes'`,
//     [employe_id, ip]
//   );
//   return parseInt(result.rows[0].count);
// }

// async function recordPinAttempt(employe_id, ip) {
//   await db.query(
//     `INSERT INTO pin_attempts (employe_id, ip) VALUES ($1, $2)`,
//     [employe_id, ip]
//   );
// }

// async function clearPinAttempts(employe_id, ip) {
//   await db.query(
//     `DELETE FROM pin_attempts WHERE employe_id = $1 OR ip = $2`,
//     [employe_id, ip]
//   );
// }

// // Logger audit
// async function logAudit(employe_id, action, details, ip, success = true) {
//   await db.query(
//     `INSERT INTO audit_logs (employe_id, action, details, ip, success)
//      VALUES ($1, $2, $3, $4, $5)`,
//     [employe_id, action, JSON.stringify(details), ip, success]
//   );
// }

// // Vérification inactivité session
// async function checkInactivity(req, res, next) {
//   const employe_id = req.user?.id;
//   if (!employe_id) return next();

//   const result = await db.query(
//     `SELECT last_activity FROM sessions
//      WHERE employe_id = $1 ORDER BY last_activity DESC LIMIT 1`,
//     [employe_id]
//   );

//   if (result.rows.length > 0) {
//     const last = new Date(result.rows[0].last_activity);
//     const now = new Date();
//     const diffMin = (now - last) / 1000 / 60;

//     if (diffMin > SESSION_INACTIVITY_MIN) {
//       await db.query(`DELETE FROM sessions WHERE employe_id = $1`, [employe_id]);
//       return res.status(401).json({ error: 'Session expirée par inactivité (5 min)' });
//     }

//     await db.query(
//       `UPDATE sessions SET last_activity = NOW() WHERE employe_id = $1`,
//       [employe_id]
//     );
//   }
//   next();
// }

// // ─── HELPERS ───
// function generateAccessToken(employe) {
//   return jwt.sign(
//     {
//       id: employe.id,
//       matricule: employe.matricule,
//       role: employe.role,
//       nom: employe.nom,
//       prenom: employe.prenom,
//       jti: crypto.randomUUID()
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: JWT_ACCESS_EXPIRY }
//   );
// }

// function generateRefreshToken(employe) {
//   return jwt.sign(
//     { id: employe.id, type: 'refresh', jti: crypto.randomUUID() },
//     process.env.JWT_SECRET,
//     { expiresIn: JWT_REFRESH_EXPIRY }
//   );
// }

// function euclideanDistance(a, b) {
//   let sum = 0;
//   for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
//   return Math.sqrt(sum);
// }

// function getClientIp(req) {
//   return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
// }

// // ─── ROUTES ───

// /**
//  * POST /api/auth/enroll
//  * Enrôlement employé (admin uniquement)
//  */
// router.post('/enroll', async (req, res) => {
//   // Vérifier admin (si tu as déjà un middleware admin, utilise-le)
//   // Pour l'instant, on laisse passer (à sécuriser)
//   const { matricule, nom, prenom, pin, badge_uid, face_embedding, role } = req.body;

//   if (!matricule || !nom || !prenom || !pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
//     return res.status(400).json({ error: 'Champs obligatoires manquants ou PIN invalide (6 chiffres)' });
//   }

//   try {
//     const pinHash = await bcrypt.hash(pin, 12);
//     const result = await db.query(
//       `INSERT INTO employes (matricule, nom, prenom, pin_hash, badge_uid, face_embedding, role)
//        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
//       [matricule, nom, prenom, pinHash, badge_uid || null,
//        face_embedding ? JSON.stringify(face_embedding) : null,
//        role || 'operateur']
//     );

//     await logAudit(result.rows[0].id, 'ENROLL', { matricule }, getClientIp(req));
//     res.json({ success: true, employe_id: result.rows[0].id });

//   } catch (err) {
//     if (err.code === '23505') {
//       return res.status(409).json({ error: 'Matricule ou badge déjà enregistré' });
//     }
//     console.error('[ENROLL ERROR]', err);
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// /**
//  * POST /api/auth/login-step1
//  * Étape 1 : Badge NFC + reconnaissance faciale
//  * Retourne un challenge temporaire pour l'étape 2
//  */
// router.post('/login-step1', async (req, res) => {
//   const { badge_uid, face_embedding } = req.body;
//   const ip = getClientIp(req);

//   if (!badge_uid || !face_embedding || !Array.isArray(face_embedding)) {
//     return res.status(400).json({ error: 'badge_uid et face_embedding (array) requis' });
//   }

//   try {
//     const result = await db.query(
//       `SELECT id, matricule, nom, prenom, face_embedding, pin_hash, actif, role
//        FROM employes WHERE badge_uid = $1`,
//       [badge_uid]
//     );

//     if (result.rows.length === 0) {
//       await logAudit(null, 'LOGIN_STEP1_FAIL', { badge_uid, reason: 'badge_inconnu' }, ip, false);
//       return res.status(404).json({ error: 'Badge non reconnu' });
//     }

//     const employe = result.rows[0];

//     if (!employe.actif) {
//       await logAudit(employe.id, 'LOGIN_STEP1_FAIL', { reason: 'compte_inactif' }, ip, false);
//       return res.status(403).json({ error: 'Compte désactivé' });
//     }

//     if (!employe.face_embedding) {
//       return res.status(400).json({ error: 'Aucun visage enregistré pour cet employé. Enrôlement requis.' });
//     }

//     // Comparaison faciale
//     const stored = typeof employe.face_embedding === 'string'
//       ? JSON.parse(employe.face_embedding)
//       : employe.face_embedding;

//     const dist = euclideanDistance(stored, face_embedding);
//     const THRESHOLD = 0.6;

//     if (dist > THRESHOLD) {
//       await logAudit(employe.id, 'LOGIN_STEP1_FAIL', { reason: 'face_mismatch', distance: dist }, ip, false);
//       return res.status(403).json({ error: 'Reconnaissance faciale échouée', distance: dist });
//     }

//     // Génère challenge temporaire (2 min)
//     const challenge = crypto.randomBytes(32).toString('hex');
//     challenges.set(challenge, {
//       employe_id: employe.id,
//       expires: Date.now() + 2 * 60 * 1000
//     });

//     // Nettoyage auto après 2 min
//     setTimeout(() => challenges.delete(challenge), 2 * 60 * 1000);

//     await logAudit(employe.id, 'LOGIN_STEP1_OK', { distance: dist }, ip);

//     res.json({
//       success: true,
//       challenge,
//       employe: {
//         id: employe.id,
//         matricule: employe.matricule,
//         nom: employe.nom,
//         prenom: employe.prenom
//       }
//     });

//   } catch (err) {
//     console.error('[LOGIN_STEP1 ERROR]', err);
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// /**
//  * POST /api/auth/login-step2
//  * Étape 2 : PIN + challenge
//  * Retourne JWT access + refresh
//  */
// router.post('/login-step2', async (req, res) => {
//   const { challenge, pin } = req.body;
//   const ip = getClientIp(req);

//   if (!challenge || !pin) {
//     return res.status(400).json({ error: 'challenge et pin requis' });
//   }

//   const chal = challenges.get(challenge);
//   if (!chal || Date.now() > chal.expires) {
//     return res.status(403).json({ error: 'Challenge expiré ou invalide (2 min max)' });
//   }

//   const employe_id = chal.employe_id;

//   try {
//     // Rate limiting PIN
//     const attempts = await checkPinRateLimit(employe_id, ip);
//     if (attempts >= PIN_ATTEMPTS_MAX) {
//       await logAudit(employe_id, 'LOGIN_STEP2_FAIL', { reason: 'rate_limited' }, ip, false);
//       return res.status(429).json({ error: 'Trop de tentatives. Compte verrouillé 15 min.' });
//     }

//     const result = await db.query(`SELECT * FROM employes WHERE id = $1`, [employe_id]);
//     if (result.rows.length === 0) {
//       return res.status(500).json({ error: 'Erreur interne' });
//     }

//     const employe = result.rows[0];
//     const valid = await bcrypt.compare(pin, employe.pin_hash);

//     if (!valid) {
//       await recordPinAttempt(employe_id, ip);
//       await logAudit(employe_id, 'LOGIN_STEP2_FAIL', { reason: 'pin_invalide' }, ip, false);
//       return res.status(403).json({ error: 'PIN incorrect' });
//     }

//     // Succès !
//     challenges.delete(challenge);
//     await clearPinAttempts(employe_id, ip);

//     const accessToken = generateAccessToken(employe);
//     const refreshToken = generateRefreshToken(employe);
//     const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
//     const jti = crypto.randomUUID();

//     await db.query(
//       `INSERT INTO refresh_tokens (employe_id, token_hash, ip, user_agent, expires_at)
//        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
//       [employe.id, refreshHash, ip, req.headers['user-agent'] || null]
//     );

//     await db.query(
//       `INSERT INTO sessions (employe_id, access_token_jti, ip)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (employe_id) DO UPDATE SET access_token_jti = $2, ip = $3, last_activity = NOW()`,
//       [employe.id, jti, ip]
//     );

//     await logAudit(employe.id, 'LOGIN_SUCCESS', { ip }, ip);

//     // Cookie httpOnly sécurisé
//     res.cookie('token', accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 15 * 60 * 1000 // 15 min
//     });

//     res.json({
//       success: true,
//       access_token: accessToken,
//       refresh_token: refreshToken,
//       employe: {
//         id: employe.id,
//         matricule: employe.matricule,
//         nom: employe.nom,
//         prenom: employe.prenom,
//         role: employe.role
//       }
//     });

//   } catch (err) {
//     console.error('[LOGIN_STEP2 ERROR]', err);
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// /**
//  * POST /api/auth/refresh
//  * Rotation des refresh tokens
//  */
// router.post('/refresh', async (req, res) => {
//   const { refresh_token } = req.body;
//   if (!refresh_token) return res.status(401).json({ error: 'Refresh token manquant' });

//   const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

//   try {
//     const result = await db.query(
//       `SELECT rt.*, e.* FROM refresh_tokens rt
//        JOIN employes e ON rt.employe_id = e.id
//        WHERE rt.token_hash = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
//       [tokenHash]
//     );

//     if (result.rows.length === 0) {
//       return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
//     }

//     const row = result.rows[0];

//     // Rotation : révoquer l'ancien
//     await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [row.id]);

//     const newAccess = generateAccessToken(row);
//     const newRefresh = generateRefreshToken(row);
//     const newRefreshHash = crypto.createHash('sha256').update(newRefresh).digest('hex');

//     await db.query(
//       `INSERT INTO refresh_tokens (employe_id, token_hash, ip, user_agent, expires_at)
//        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
//       [row.employe_id, newRefreshHash, getClientIp(req), req.headers['user-agent'] || null]
//     );

//     res.cookie('token', newAccess, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 15 * 60 * 1000
//     });

//     res.json({ access_token: newAccess, refresh_token: newRefresh });

//   } catch (err) {
//     console.error('[REFRESH ERROR]', err);
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// /**
//  * POST /api/auth/logout
//  */
// router.post('/logout', async (req, res) => {
//   // Récupérer l'employé depuis le token (si présent)
//   let employe_id = null;
//   try {
//     const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       employe_id = decoded.id;
//     }
//   } catch (e) {}

//   if (employe_id) {
//     await db.query(`DELETE FROM sessions WHERE employe_id = $1`, [employe_id]);
//     await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE employe_id = $1`, [employe_id]);
//     await logAudit(employe_id, 'LOGOUT', {}, getClientIp(req));
//   }

//   res.clearCookie('token');
//   res.json({ success: true });
// });

// /**
//  * GET /api/auth/me
//  * Profil connecté + vérification inactivité
//  */
// router.get('/me', async (req, res) => {
//   // Ton middleware auth doit déjà avoir mis req.user
//   if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

//   try {
//     const result = await db.query(
//       `SELECT id, matricule, nom, prenom, role, actif FROM employes WHERE id = $1`,
//       [req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Employé introuvable' });
//     }

//     const employe = result.rows[0];

//     // Vérifier inactivité
//     const sess = await db.query(
//       `SELECT last_activity FROM sessions WHERE employe_id = $1 ORDER BY last_activity DESC LIMIT 1`,
//       [employe.id]
//     );

//     if (sess.rows.length > 0) {
//       const last = new Date(sess.rows[0].last_activity);
//       const diffMin = (new Date() - last) / 1000 / 60;
//       if (diffMin > SESSION_INACTIVITY_MIN) {
//         await db.query(`DELETE FROM sessions WHERE employe_id = $1`, [employe.id]);
//         return res.status(401).json({ error: 'Session expirée par inactivité' });
//       }
//       await db.query(`UPDATE sessions SET last_activity = NOW() WHERE employe_id = $1`, [employe.id]);
//     }

//     res.json({ employe });

//   } catch (err) {
//     console.error('[ME ERROR]', err);
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// /**
//  * GET /api/auth/audit
//  * Logs audit (admin)
//  */
// router.get('/audit', async (req, res) => {
//   // Vérifier admin
//   if (!req.user || req.user.role !== 'administrateur') {
//     return res.status(403).json({ error: 'Accès refusé — admin requis' });
//   }

//   try {
//     const result = await db.query(
//       `SELECT a.*, e.matricule, e.nom, e.prenom
//        FROM audit_logs a
//        LEFT JOIN employes e ON a.employe_id = e.id
//        ORDER BY a.created_at DESC LIMIT 500`
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;