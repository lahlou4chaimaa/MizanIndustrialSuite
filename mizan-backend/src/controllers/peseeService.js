// Service métier "Pesée" : calculs et règles de conformité.
// Séparé du contrôleur pour rester testable indépendamment de l'API HTTP.

const pool = require("../../config/db");

/**
 * Détermine le statut de conformité en comparant le poids net
 * aux seuils min/max définis pour la marchandise.
 */
function calculerStatutConformite(poidsNet, marchandise) {
  if (!marchandise) return "a_verifier";
  if (poidsNet < marchandise.poids_min) return "anomalie";
  if (poidsNet > marchandise.poids_max) return "anomalie";
  return "conforme";
}

async function getMarchandise(id) {
  if (!id) return null;
  const { rows } = await pool.query("SELECT * FROM marchandise WHERE id = $1", [id]);
  return rows[0];
}

module.exports = { calculerStatutConformite, getMarchandise };
