"use strict";
import { DataTypes } from "sequelize";


// ==========================================
// CREAZIONE MODELLO PARTITA
// ==========================================

export function CreaPartita(database) {
    return database.define('Partita' , {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        parola : {
            type : DataTypes.STRING,
            allowNull: false

        },
        argomento: {
            type: DataTypes.STRING,
            allowNull: false
        },
        suggerimento: {
            type: DataTypes.STRING,
            allowNull: false
        },
        foto: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        attiva : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true  
        },
        utenteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'utenti',
                key: 'id'
            }
        }
    }, {
        tableName: 'partite',
        timestamps: true,
    })
}