const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class PrestationFacturation extends Model {
        static associate(models) {

            // ====================================================
            // FACTURATION → PRESTATION
            // ====================================================

            PrestationFacturation.belongsTo(models.Prestation, {
                foreignKey: "prestation_id",
                as: "prestation",
            });
        }
    }

    PrestationFacturation.init(
        {
            // ====================================================
            // ID
            // ====================================================

            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },


            // ====================================================
            // PRESTATION
            // ====================================================

            prestation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },


            // ====================================================
            // CODE
            // ====================================================

            code: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },


            // ====================================================
            // LIBELLE
            // ====================================================

            libelle: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },


            // ====================================================
            // QUANTITE
            // ====================================================

            quantite: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 1,
            },


            // ====================================================
            // UNITE
            // ====================================================

            unite: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },


            // ====================================================
            // PRIX UNITAIRE
            // ====================================================

            prix_unitaire: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // TVA
            // ====================================================

            tva: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 20,
            },


            // ====================================================
            // TOTAL HT
            // ====================================================

            total_ht: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // TOTAL TTC
            // ====================================================

            total_ttc: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // DATE CREATION
            // ====================================================

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },


            // ====================================================
            // DATE MODIFICATION
            // ====================================================

            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "PrestationFacturation",
            tableName: "prestation_facturations",
            timestamps: false,
        }
    );

    return PrestationFacturation;
};