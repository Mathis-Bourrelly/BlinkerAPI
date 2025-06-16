const BaseRepository = require('./base.repository');
const { Tags, BlinkTags, Blinks } = require('../models/associations');
const { sequelize } = require('../core/postgres');
const { Op } = require('sequelize');

class TagsRepository extends BaseRepository {
    constructor() {
        super(Tags);
    }

    /**
     * Trouve ou crée un tag par nom
     */
    async findOrCreateTag(name, transaction = null) {
        const normalizedName = name.trim().toLowerCase();
        
        const [tag, created] = await Tags.findOrCreate({
            where: { name: normalizedName },
            defaults: { name: normalizedName },
            transaction
        });

        return { tag, created };
    }

    /**
     * Trouve plusieurs tags par noms
     */
    async findTagsByNames(names, transaction = null) {
        const normalizedNames = names.map(name => name.trim().toLowerCase());
        
        return await Tags.findAll({
            where: {
                name: {
                    [Op.in]: normalizedNames
                }
            },
            transaction
        });
    }

    /**
     * Associe des tags à un blink
     */
    async addTagsToBlink(blinkID, tagIDs, transaction = null) {
        // Vérifier d'abord le nombre de tags existants pour ce blink
        const existingTagsCount = await BlinkTags.count({
            where: { blinkID },
            transaction
        });

        if (existingTagsCount + tagIDs.length > 3) {
            throw new Error('Un blink ne peut avoir que 3 tags maximum');
        }

        const blinkTags = tagIDs.map(tagID => ({
            blinkID,
            tagID
        }));

        return await BlinkTags.bulkCreate(blinkTags, {
            transaction,
            ignoreDuplicates: true
        });
    }

    /**
     * Supprime tous les tags d'un blink
     */
    async removeAllTagsFromBlink(blinkID, transaction = null) {
        return await BlinkTags.destroy({
            where: { blinkID },
            transaction
        });
    }

    /**
     * Récupère les tags d'un blink
     */
    async getBlinkTags(blinkID, transaction = null) {
        return await Tags.findAll({
            include: [{
                model: BlinkTags,
                as: 'blinkTags',
                where: { blinkID },
                attributes: []
            }],
            transaction
        });
    }

    /**
     * Récupère les statistiques des tags les plus utilisés
     */
    async getTagStats(timeFilter = null, limit = 20) {
        let whereClause = {};
        
        if (timeFilter) {
            const now = new Date();
            let startDate;
            
            switch (timeFilter) {
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                whereClause.createdAt = {
                    [Op.gte]: startDate
                };
            }
        }

        const result = await sequelize.query(`
            SELECT 
                t."tagID",
                t."name",
                COUNT(bt."blinkTagID") as "usageCount",
                COUNT(DISTINCT bt."blinkID") as "uniqueBlinks"
            FROM "Tags" t
            LEFT JOIN "BlinkTags" bt ON t."tagID" = bt."tagID"
            ${timeFilter && timeFilter !== 'all' ? `
                AND bt."createdAt" >= :startDate
            ` : ''}
            GROUP BY t."tagID", t."name"
            HAVING COUNT(bt."blinkTagID") > 0
            ORDER BY "usageCount" DESC
            LIMIT :limit
        `, {
            replacements: {
                startDate: timeFilter && timeFilter !== 'all' ? 
                    this.getStartDateForFilter(timeFilter) : null,
                limit
            },
            type: sequelize.QueryTypes.SELECT
        });

        return result;
    }

    /**
     * Recherche des tags par nom (pour l'autocomplétion)
     */
    async searchTags(query, limit = 10) {
        return await Tags.findAll({
            where: {
                name: {
                    [Op.iLike]: `%${query.toLowerCase()}%`
                }
            },
            order: [['name', 'ASC']],
            limit
        });
    }

    /**
     * Récupère les blinks associés à des tags spécifiques
     */
    async getBlinksByTags(tagNames, page = 1, limit = 10) {
        const normalizedNames = tagNames.map(name => name.trim().toLowerCase());
        
        const offset = (page - 1) * limit;

        const result = await sequelize.query(`
            SELECT DISTINCT b."blinkID", b."createdAt"
            FROM "Blinks" b
            INNER JOIN "BlinkTags" bt ON b."blinkID" = bt."blinkID"
            INNER JOIN "Tags" t ON bt."tagID" = t."tagID"
            WHERE t."name" IN (:tagNames)
            ORDER BY b."createdAt" DESC
            LIMIT :limit OFFSET :offset
        `, {
            replacements: {
                tagNames: normalizedNames,
                limit,
                offset
            },
            type: sequelize.QueryTypes.SELECT
        });

        const total = await sequelize.query(`
            SELECT COUNT(DISTINCT b."blinkID") as count
            FROM "Blinks" b
            INNER JOIN "BlinkTags" bt ON b."blinkID" = bt."blinkID"
            INNER JOIN "Tags" t ON bt."tagID" = t."tagID"
            WHERE t."name" IN (:tagNames)
        `, {
            replacements: {
                tagNames: normalizedNames
            },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            blinkIDs: result.map(row => row.blinkID),
            total: parseInt(total[0].count),
            page,
            limit,
            totalPages: Math.ceil(parseInt(total[0].count) / limit)
        };
    }

    /**
     * Utilitaire pour calculer la date de début selon le filtre
     */
    getStartDateForFilter(timeFilter) {
        const now = new Date();
        
        switch (timeFilter) {
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }
}

module.exports = new TagsRepository();
