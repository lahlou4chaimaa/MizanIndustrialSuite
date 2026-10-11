const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

/*
 * ============================================================
 * MODÈLE UTILISATEUR
 * ============================================================
 *
 * Table PostgreSQL :
 * utilisateurs
 *
 * Colonnes utilisées :
 * - id
 * - nom
 * - email
 * - mot_de_passe_hash
 * - role
 * - date_creation
 */

const UserModel = sequelize.define(
    "Utilisateur",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        mot_de_passe_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "agent_pesee",
        },

        date_creation: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "utilisateurs",
        timestamps: false,
    }
);


/*
 * ============================================================
 * COMPATIBILITÉ AVEC authController.js
 * ============================================================
 *
 * authController utilise :
 *
 * User.create(...)
 * User.findByEmail(...)
 * User.findById(...)
 *
 * On conserve donc exactement cette interface.
 */

const User = {

    async create({
        nom,
        email,
        motDePasseHash,
        role,
    }) {

        const user = await UserModel.create({
            nom,
            email,
            mot_de_passe_hash: motDePasseHash,
            role: role || "agent_pesee",
        });

        return user.toJSON();
    },


    async findByEmail(email) {

        const user = await UserModel.findOne({
            where: {
                email,
            },
        });

        if (!user) {
            return null;
        }

        return user.toJSON();
    },


    async findById(id) {

        const user = await UserModel.findByPk(id, {
            attributes: [
                "id",
                "nom",
                "email",
                "role",
                "date_creation",
            ],
        });

        if (!user) {
            return null;
        }

        return user.toJSON();
    },
};


module.exports = User;