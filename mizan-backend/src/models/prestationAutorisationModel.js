const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class PrestationAutorisation extends Model {
        static associate(models) {
            PrestationAutorisation.belongsTo(models.Prestation, {
                foreignKey: "prestation_id",
                as: "prestation",
            });

            PrestationAutorisation.belongsTo(models.Camion, {
                foreignKey: "camion_id",
                as: "camion",
            });

            PrestationAutorisation.belongsTo(models.Chauffeur, {
                foreignKey: "chauffeur_id",
                as: "chauffeur",
            });
        }
    }

    PrestationAutorisation.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            prestation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            camion_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            chauffeur_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            type_autorisation: {
                type: DataTypes.ENUM(
                    "CAMION",
                    "CHAUFFEUR",
                    "CAMION_CHAUFFEUR"
                ),
                allowNull: false,
            },

            actif: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },

            date_debut: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            date_fin: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            observations: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "PrestationAutorisation",
            tableName: "prestation_autorisations",
            timestamps: false,
        }
    );

    return PrestationAutorisation;
};