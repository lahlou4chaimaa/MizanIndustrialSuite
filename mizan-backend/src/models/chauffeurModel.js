const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Chauffeur extends Model {
    static associate(models) {
      Chauffeur.hasMany(models.Pesee, {
        foreignKey: "chauffeur_id",
        as: "pesees",
      });

      Chauffeur.hasMany(models.Ticket, {
        foreignKey: "chauffeur_id",
        as: "tickets",
      });

      Chauffeur.hasMany(models.Prestation, {
        foreignKey: "chauffeur_id",
        as: "prestations",
      });

      // NOUVELLE RELATION
      Chauffeur.hasMany(models.PrestationAutorisation, {
        foreignKey: "chauffeur_id",
        as: "autorisationsPrestations",
      });
    }
  }

  Chauffeur.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      prenom: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      cin: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      code_qr: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },

      photo_reference_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Chauffeur",
      tableName: "chauffeurs",
      timestamps: false,
    }
  );

  return Chauffeur;
};