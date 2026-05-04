"use strict";

import { DataTypes } from "sequelize";
import { createHash } from "crypto";

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
            beforeCreate: (utente) => {
                if (utente.password) {
                    utente.password = createHash('sha256')
                        .update(utente.password)
                        .digest('hex');
                }
            },
            beforeUpdate: (utente) => {
                if (utente.changed('password') && utente.password) {
                    utente.password = createHash('sha256')
                        .update(utente.password)
                        .digest('hex');
                }
            }
        }
    });
}