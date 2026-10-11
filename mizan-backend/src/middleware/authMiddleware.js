// // // const jwt = require('jsonwebtoken');

// // // const authMiddleware = (req, res, next) => {
// // //   const authHeader = req.headers.authorization;

// // //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
// // //     return res.status(401).json({ error: 'Accès refusé : Aucun jeton fourni' });
// // //   }

// // //   const token = authHeader.split(' ')[1];

// // //   try {
// // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// // //     req.user = decoded; // Stocke le payload { id, role } dans l'objet req
// // //     next();
// // //   } catch (err) {
// // //     return res.status(403).json({ error: 'Jeton invalide ou expiré' });
// // //   }
// // // };

// // // module.exports = authMiddleware;


// // const jwt = require('jsonwebtoken');

// // module.exports = (req, res, next) => {
// //   const authHeader = req.headers.authorization;

// //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
// //     return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
// //   }

// //   const token = authHeader.split(' ')[1];

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
// //     req.user = decoded; // Attache l'utilisateur (id, role, etc.)
// //     next();
// //   } catch (error) {
// //     return res.status(403).json({ error: 'Token invalide ou expiré.' });
// //   }
// // };


// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   // 1. Cherche le token dans les cookies HTTP-Only en priorité
//   let token = req.cookies ? req.cookies.token : null;

//   // 2. Si non présent, cherche dans l'en-tête Authorization
//   if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     token = req.headers.authorization.split(' ')[1];
//   }

//   if (!token) {
//     return res.status(401).json({ error: 'Accès non autorisé. Session absente.' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
//     req.user = decoded; // Injection de { id, role } dans req.user
//     next();
//   } catch (error) {
//     return res.status(403).json({ error: 'Session invalide ou expirée.' });
//   }
// };



const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let token =
    req.cookies
      ? req.cookies.token
      : null;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith(
      "Bearer "
    )
  ) {
    token =
      req.headers.authorization.split(
        " "
      )[1];
  }

  /*
   * Mode développement
   */
  if (!token) {
    req.user = {
      id: "admin-dev-id",
      nom: "Admin Dev",
      role: "administrateur",
    };

    return next();
  }

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET ||
        "votre_secret_jwt"
      );

    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(403).json({
      error:
        "Session invalide ou expirée.",
    });
  }
};