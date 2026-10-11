const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class RendezVous extends Model {
        static associate(models) {
            RendezVous.belongsTo(models.Camion, {
                foreignKey: "camion_id",
                as: "camion",
            });

            RendezVous.belongsTo(models.Chauffeur, {
                foreignKey: "chauffeur_id",
                as: "chauffeur",
            });
        }
    }

    RendezVous.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            camion_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            chauffeur_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            date_rdv: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },

            creneau_horaire: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            statut: {
                type: DataTypes.ENUM(
                    "PROGRAMME",
                    "HONORE",
                    "ANNULE",
                    "EN_RETARD"
                ),
                allowNull: false,
                defaultValue: "PROGRAMME",
            },

            date_creation: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "RendezVous",
            tableName: "rendez_vous",
            timestamps: false,
        }
    );

    return RendezVous;
};