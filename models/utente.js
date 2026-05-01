"use strict";

import { DataTypes } from "sequelize";
import { createHash } from "crypto";

export function CreaUtente(database) {
    return database.define('Utente', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        cognome: {
            type: DataTypes.STRING(100),
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
        },
        passwordHash: {
            type: DataTypes.STRING(128),
            allowNull: false
        }
    }, {
        tableName: 'utenti',
        timestamps: true,
        hooks: {
            beforeCreate: (utente) => {
                if (utente.passwordHash) {
                    utente.passwordHash = createHash('sha256')
                        .update(utente.passwordHash)
                        .digest('hex');
                }
            },
            beforeUpdate: (utente) => {
                if (utente.changed('passwordHash') && utente.passwordHash) {
                    utente.passwordHash = createHash('sha256')
                        .update(utente.passwordHash)
                        .digest('hex');
                }
            }
        }
    });
}