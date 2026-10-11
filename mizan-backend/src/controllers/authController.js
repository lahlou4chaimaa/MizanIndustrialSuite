const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(mot_de_passe, salt);

    const newUser = await User.create({
      nom,
      email,
      motDePasseHash: hash,
      role: role || 'OPERATEUR'
    });

    return res.status(201).json({ message: 'Utilisateur créé avec succès', user: newUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Connexion utilisateur / opérateur
exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Identifiants invalides' });
    }

    // Génération du JWT (valide 8 heures)
    const token = jwt.sign(
      { id: user.id, nom: user.nom, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '8h' }
    );

    // Stockage dans un cookie HTTP-Only pour une persistance automatique sans JS
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 heures
    });

    return res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Vérification de la session courante
exports.getMe = async (req, res) => {
  return res.status(200).json({
    authenticated: true,
    user: req.user
  });
};

// Déconnexion
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: "Déconnexion réussie" });
};