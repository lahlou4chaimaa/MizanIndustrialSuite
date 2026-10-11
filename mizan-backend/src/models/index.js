const { sequelize } = require("../../config/db");


// ============================================================
// CHARGEMENT DES MODELES
// ============================================================

const Camion = require("./camionModel")(sequelize);

const Chauffeur =
    require("./chauffeurModel")(sequelize);

const Marchandise =
    require("./marchandiseModel")(sequelize);

const Pesee =
    require("./peseeModel")(sequelize);

const Ticket =
    require("./ticketModel")(sequelize);

const Prestation =
    require("./prestationModel")(sequelize);

const PrestationFacturation =
    require("./PrestationFacturation")(sequelize);

const Zone =
    require("./zoneModel")(sequelize);

const PrestationAutorisation =
    require("./prestationAutorisationModel")(sequelize);

const PrestationCamion =
    require("./prestationCamionModel")(sequelize);


// ============================================================
// NOUVEAU MODELE : RENDEZ-VOUS
// ============================================================

const RendezVous =
    require("./rdvModel")(sequelize);


// ============================================================
// OBJET CENTRAL DES MODELES
// ============================================================

const models = {
    Camion,
    Chauffeur,
    Marchandise,
    Pesee,
    Ticket,
    Prestation,
    PrestationFacturation,
    Zone,
    PrestationAutorisation,
    PrestationCamion,
    RendezVous,
};


// ============================================================
// INITIALISATION DES ASSOCIATIONS
// ============================================================

Object.values(models).forEach((model) => {
    if (
        model &&
        typeof model.associate === "function"
    ) {
        model.associate(models);
    }
});


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    sequelize,
    models,

    Camion,
    Chauffeur,
    Marchandise,
    Pesee,
    Ticket,
    Prestation,
    PrestationFacturation,
    Zone,
    PrestationAutorisation,
    PrestationCamion,
    RendezVous,
};