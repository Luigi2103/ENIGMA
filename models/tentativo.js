"use strict";

import { DataTypes } from "sequelize";

// ==========================================
// CREAZIONE MODELLO TENTATIVO
// ==========================================

export function CreaTentativo(database) {
    return database.define('Tentativo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        risposta: {
            type: DataTypes.STRING,
            allowNull: false
        },
        esito: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        utenteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'utenti',
                key: 'id'
            }
        },
        partitaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'partite',
                key: 'id'
            }
        }
    }, {
        tableName: 'tentativi',
        timestamps: true
    });
}