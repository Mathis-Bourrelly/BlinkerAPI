const TagsRepository = require('../repository/tags.repository');
const { withTransaction } = require('../utils/error.utils');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');

class TagsService {
    /**
     * Traite et associe des tags à un blink
     */
    async processBlinkTags(blinkID, tagNames, transaction = null) {
        if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
            return [];
        }

        // Valider le nombre de tags
        if (tagNames.length > 3) {
            throw new Error('Un blink ne peut avoir que 3 tags maximum');
        }

        // Nettoyer et valider les noms de tags
        const cleanedTagNames = tagNames
            .map(name => name.trim())
            .filter(name => name.length > 0 && name.length <= 50)
            .slice(0, 3); // S'assurer qu'on ne dépasse pas 3 tags

        if (cleanedTagNames.length === 0) {
            return [];
        }

        const tagIDs = [];
        
        // Créer ou récupérer chaque tag
        for (const tagName of cleanedTagNames) {
            const { tag } = await TagsRepository.findOrCreateTag(tagName, transaction);
            tagIDs.push(tag.tagID);
        }

        // Associer les tags au blink
        await TagsRepository.addTagsToBlink(blinkID, tagIDs, transaction);

        return tagIDs;
    }

    /**
     * Met à jour les tags d'un blink
     */
    async updateBlinkTags(blinkID, tagNames, transaction = null) {
        return await withTransaction(async (tx) => {
            // Supprimer tous les tags existants
            await TagsRepository.removeAllTagsFromBlink(blinkID, tx);
            
            // Ajouter les nouveaux tags
            return await this.processBlinkTags(blinkID, tagNames, tx);
        }, transaction || sequelize, ErrorCodes.Tags?.UpdateFailed || 'TAG_UPDATE_FAILED');
    }

    /**
     * Récupère les tags d'un blink
     */
    async getBlinkTags(blinkID) {
        return await TagsRepository.getBlinkTags(blinkID);
    }

    /**
     * Récupère les statistiques des tags les plus utilisés
     */
    async getPopularTags(timeFilter = 'all', limit = 20) {
        const validFilters = ['24h', '7d', '30d', 'all'];
        const filter = validFilters.includes(timeFilter) ? timeFilter : 'all';
        
        return await TagsRepository.getTagStats(filter === 'all' ? null : filter, limit);
    }

    /**
     * Recherche des tags pour l'autocomplétion
     */
    async searchTags(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        return await TagsRepository.searchTags(query.trim(), limit);
    }

    /**
     * Récupère les blinks associés à des tags spécifiques
     */
    async getBlinksByTags(tagNames, page = 1, limit = 10) {
        if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
            return {
                blinkIDs: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            };
        }

        return await TagsRepository.getBlinksByTags(tagNames, page, limit);
    }

    /**
     * Valide un tableau de noms de tags
     */
    validateTagNames(tagNames) {
        if (!Array.isArray(tagNames)) {
            throw new Error('Les tags doivent être fournis sous forme de tableau');
        }

        if (tagNames.length > 3) {
            throw new Error('Un blink ne peut avoir que 3 tags maximum');
        }

        const errors = [];
        
        tagNames.forEach((tagName, index) => {
            if (typeof tagName !== 'string') {
                errors.push(`Le tag à l'index ${index} doit être une chaîne de caractères`);
                return;
            }

            const trimmed = tagName.trim();
            
            if (trimmed.length === 0) {
                errors.push(`Le tag à l'index ${index} ne peut pas être vide`);
                return;
            }

            if (trimmed.length > 50) {
                errors.push(`Le tag à l'index ${index} ne peut pas dépasser 50 caractères`);
                return;
            }

            // Vérifier les caractères autorisés
            const validPattern = /^[a-zA-Z0-9àáâäçéèêëíìîïñóòôöúùûüýÿ\s\-_#]+$/i;
            if (!validPattern.test(trimmed)) {
                errors.push(`Le tag à l'index ${index} contient des caractères non autorisés`);
            }
        });

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }

        return true;
    }

    /**
     * Récupère les tags tendances selon différents critères
     */
    async getTrendingTags() {
        const results = await Promise.all([
            this.getPopularTags('24h', 10),
            this.getPopularTags('7d', 10),
            this.getPopularTags('30d', 10),
            this.getPopularTags('all', 10)
        ]);

        return {
            last24h: results[0],
            last7days: results[1],
            last30days: results[2],
            allTime: results[3]
        };
    }
}

module.exports = new TagsService();
