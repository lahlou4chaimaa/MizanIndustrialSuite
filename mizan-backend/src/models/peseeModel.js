const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Pesee extends Model {
    static associate(models) {
      Pesee.belongsTo(models.Prestation, {
        foreignKey: "prestation_id",
        as: "prestation",
        required: false,
      });

      Pesee.belongsTo(models.Camion, {
        foreignKey: "camion_id",
        as: "camion",
      });

      Pesee.belongsTo(models.Chauffeur, {
        foreignKey: "chauffeur_id",
        as: "chauffeur",
        required: false,
      });

      Pesee.belongsTo(models.Marchandise, {
        foreignKey: "marchandise_id",
        as: "marchandise",
        required: false,
      });

      Pesee.hasOne(models.Ticket, {
        foreignKey: "pesee_id",
        as: "ticket",
      });
    }
  }

  Pesee.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      /*
       * IMPORTANT :
       * Une pesée peut maintenant être créée
       * avant son association à une prestation.
       */
      prestation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "prestations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      camion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "camions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      chauffeur_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "chauffeurs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      marchandise_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "marchandises",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      immatriculation_tracteur_scanned: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      immatriculation_remorque_scanned: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      poids_tare: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      poids_brut: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      poids_net: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      photo_scan_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      identite_confirmee: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      statut: {
        type: DataTypes.ENUM(
          "ENTREE",
          "ENCOURS",
          "VALIDE",
          "ANNULEE"
        ),
        allowNull: false,
        defaultValue: "ENTREE",
      },

      date_entree: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      date_sortie: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Pesee",
      tableName: "pesees",
      timestamps: false,
      underscored: true,
    }
  );

  return Pesee;
};