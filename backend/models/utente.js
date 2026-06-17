"use strict";

import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// ==========================================
// CREAZIONE MODELLO UTENTE
// ==========================================
export function CreaUtente(database) {
    return database.define('Utente', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        cognome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        fotoProfilo: {
            type: DataTypes.BLOB('long'),
            allowNull: true,
            get() {
                const data = this.getDataValue('fotoProfilo');
                return data ? data.toString('base64') : null;
            },
            set(value) {
                if (!value) {
                    this.setDataValue('fotoProfilo', null);
                } else if (typeof value === 'string') {
                    this.setDataValue('fotoProfilo', Buffer.from(value, 'base64'));
                } else {
                    this.setDataValue('fotoProfilo', value);
                }
            }
        }
    }, {
        tableName: 'utenti',
        timestamps: true,
        hooks: {
            beforeCreate: async (utente) => {
                if (utente.password) {
                    utente.password = await bcrypt.hash(utente.password, SALT_ROUNDS);
                }
            },
            beforeUpdate: async (utente) => {
                if (utente.changed('password') && utente.password) {
                    utente.password = await bcrypt.hash(utente.password, SALT_ROUNDS);
                }
            }
        }
    });
}