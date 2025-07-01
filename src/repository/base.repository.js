/**
 * Classe de base pour les repositories
 * Fournit des méthodes CRUD communes pour tous les repositories
 */
const { createError } = require('../utils/error.utils');

class BaseRepository {
    /**
     * Constructeur
     * @param {Object} model - Modèle Sequelize
     * @param {Object} errorCodes - Codes d'erreur spécifiques à l'entité
     */
    constructor(model, errorCodes) {
        this.model = model;
        this.errorCodes = errorCodes;
    }

    /**
     * Crée une nouvelle entité
     * @param {Object} data - Données de l'entité à créer
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} L'entité créée
     */
    async create(data, options = {}) {
        try {
            return await this.model.create(data, options);
        } catch (error) {
            throw createError(this.errorCodes?.CreationFailed, error);
        }
    }

    /**
     * Récupère une entité par son ID
     * @param {string} id - ID de l'entité
     * @param {Object} options - Options Sequelize (ex: include, attributes)
     * @returns {Promise<Object|null>} L'entité trouvée ou null
     */
    async findById(id, options = {}) {
        try {
            const entity = await this.model.findByPk(id, options);
            return entity;
        } catch (error) {
            throw createError(this.errorCodes?.FetchFailed, error);
        }
    }

    /**
     * Récupère toutes les entités
     * @param {Object} options - Options Sequelize (ex: where, include, order)
     * @returns {Promise<Array>} Liste des entités
     */
    async findAll(options = {}) {
        try {
            return await this.model.findAll(options);
        } catch (error) {
            throw createError(this.errorCodes?.FetchFailed, error);
        }
    }

    /**
     * Met à jour une entité
     * @param {string} id - ID de l'entité
     * @param {Object} data - Données à mettre à jour
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} L'entité mise à jour
     */
    async update(id, data, options = {}) {
        try {
            const [updated] = await this.model.update(data, {
                where: { [this.model.primaryKeyAttribute]: id },
                ...options
            });

            if (updated === 0) {
                throw createError(this.errorCodes?.NotFound);
            }

            return this.findById(id);
        } catch (error) {
            throw createError(this.errorCodes?.UpdateFailed, error);
        }
    }

    /**
     * Supprime une entité
     * @param {string} id - ID de l'entité
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<boolean>} true si supprimé, false sinon
     */
    async delete(id, options = {}) {
        try {
            const deleted = await this.model.destroy({
                where: { [this.model.primaryKeyAttribute]: id },
                ...options
            });

            if (deleted === 0) {
                throw createError(this.errorCodes?.NotFound);
            }

            return true;
        } catch (error) {
            throw createError(this.errorCodes?.DeletionFailed, error);
        }
    }

    /**
     * Compte le nombre d'entités correspondant aux critères
     * @param {Object} options - Options Sequelize (ex: where)
     * @returns {Promise<number>} Nombre d'entités
     */
    async count(options = {}) {
        try {
            return await this.model.count(options);
        } catch (error) {
            throw createError(this.errorCodes?.FetchFailed, error);
        }
    }
}

module.exports = BaseRepository;
