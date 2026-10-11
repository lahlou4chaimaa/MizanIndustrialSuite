const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Camion extends Model {
    static associate(models) {
      Camion.hasMany(models.Pesee, {
        foreignKey: "camion_id",
        as: "pesees",
      });

      Camion.hasMany(models.Ticket, {
        foreignKey: "camion_id",
        as: "tickets",
      });

      Camion.hasMany(models.Prestation, {
        foreignKey: "camion_id",
        as: "prestations",
      });

      // NOUVELLE RELATION
      Camion.hasMany(models.PrestationAutorisation, {
        foreignKey: "camion_id",
        as: "autorisationsPrestations",
      });
      Camion.hasMany(models.PrestationCamion, {
        foreignKey: "camion_id",
        as: "prestationsCamion",
        onDelete: "CASCADE",
      });
    }
  }

  Camion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      immatriculation: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      immatriculation_remorque: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      marque: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      societe_transport: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Camion",
      tableName: "camions",
      timestamps: false,
    }
  );

  return Camion;
};