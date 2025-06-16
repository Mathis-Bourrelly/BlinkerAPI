// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const { Tags } = require('../src/models/associations');
const TagsService = require('../src/services/tags.service');

const seedTags = async () => {
    try {
        console.log('🏷️ Début du seeding des tags...');

        // Liste de tags prédéfinis pour différentes catégories
        const predefinedTags = [
            // Technologie
            'technologie', 'innovation', 'web', 'mobile', 'ia', 'blockchain', 'crypto',
            'développement', 'programmation', 'javascript', 'python', 'react', 'nodejs',
            'api', 'database', 'cloud', 'devops', 'cybersécurité', 'opensource',
            
            // Lifestyle
            'lifestyle', 'voyage', 'food', 'cuisine', 'restaurant', 'recette',
            'fitness', 'sport', 'yoga', 'meditation', 'wellness', 'santé',
            'mode', 'style', 'beauté', 'diy', 'décoration', 'maison',
            
            // Culture & Divertissement
            'culture', 'art', 'musique', 'cinéma', 'livre', 'lecture',
            'gaming', 'jeux', 'streaming', 'podcast', 'série', 'film',
            'photographie', 'design', 'créativité', 'inspiration',
            
            // Business & Carrière
            'business', 'startup', 'entrepreneur', 'marketing', 'finance',
            'carrière', 'formation', 'éducation', 'productivité', 'leadership',
            'networking', 'freelance', 'remote', 'management',
            
            // Nature & Environnement
            'nature', 'environnement', 'écologie', 'durable', 'bio',
            'jardinage', 'animaux', 'climat', 'recyclage', 'green',
            
            // Actualités & Société
            'actualités', 'politique', 'société', 'économie', 'science',
            'recherche', 'découverte', 'histoire', 'géographie', 'monde',
            
            // Hobbies & Loisirs
            'hobby', 'collection', 'bricolage', 'artisanat', 'peinture',
            'musique', 'instrument', 'danse', 'théâtre', 'écriture',
            'blog', 'vlog', 'tutorial', 'tips', 'astuce'
        ];

        let tagsCreated = 0;
        let tagsSkipped = 0;

        console.log(`📊 Tentative de création de ${predefinedTags.length} tags...`);

        for (const tagName of predefinedTags) {
            try {
                // Vérifier si le tag existe déjà
                const existingTag = await Tags.findOne({
                    where: { name: tagName.toLowerCase() }
                });

                if (existingTag) {
                    console.log(`⚠️ Tag "${tagName}" existe déjà`);
                    tagsSkipped++;
                    continue;
                }

                // Créer le tag en utilisant le repository
                const { tag, created } = await require('../src/repository/tags.repository').findOrCreateTag(tagName);
                
                if (created) {
                    console.log(`✅ Tag créé: "${tag.name}" (${tag.tagID})`);
                    tagsCreated++;
                } else {
                    console.log(`⚠️ Tag "${tagName}" existait déjà`);
                    tagsSkipped++;
                }

                // Petite pause pour éviter de surcharger la base
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                console.error(`❌ Erreur lors de la création du tag "${tagName}":`, error.message);
            }
        }

        console.log('\n📊 Résumé du seeding des tags:');
        console.log(`✅ Tags créés: ${tagsCreated}`);
        console.log(`⚠️ Tags ignorés (déjà existants): ${tagsSkipped}`);
        console.log('🎉 Seeding des tags terminé avec succès !');

        // Afficher quelques statistiques
        const totalTags = await Tags.count();
        console.log(`📈 Total des tags en base: ${totalTags}`);

        // Afficher quelques tags créés
        const sampleTags = await Tags.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        console.log('\n🏷️ Derniers tags créés:');
        sampleTags.forEach(tag => {
            console.log(`  - ${tag.name} (${tag.tagID})`);
        });

        return { tagsCreated, tagsSkipped, totalTags };

    } catch (error) {
        console.error('❌ Erreur lors du seeding des tags:', error);
        throw error;
    }
};

/**
 * Fonction utilitaire pour obtenir des tags aléatoires pour un blink
 * @param {number} maxTags - Nombre maximum de tags (défaut: 3)
 * @returns {Promise<string[]>} - Tableau de noms de tags
 */
const getRandomTagsForBlink = async (maxTags = 3) => {
    try {
        // Récupérer tous les tags disponibles
        const allTags = await Tags.findAll({
            attributes: ['name']
        });

        if (allTags.length === 0) {
            return [];
        }

        // Déterminer le nombre de tags à assigner (0 à maxTags)
        const numTags = Math.floor(Math.random() * (maxTags + 1));
        
        if (numTags === 0) {
            return [];
        }

        // Mélanger les tags et en prendre un nombre aléatoire
        const shuffledTags = allTags.sort(() => 0.5 - Math.random());
        const selectedTags = shuffledTags.slice(0, numTags);

        return selectedTags.map(tag => tag.name);

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des tags aléatoires:', error);
        return [];
    }
};

/**
 * Fonction utilitaire pour obtenir des tags thématiques selon le type de contenu
 * @param {string} contentType - Type de contenu ('text', 'image', 'video')
 * @param {string} content - Contenu du blink
 * @returns {string[]} - Tableau de noms de tags appropriés
 */
const getThematicTags = (contentType, content) => {
    const tagsByTheme = {
        tech: ['technologie', 'innovation', 'web', 'développement', 'api'],
        lifestyle: ['lifestyle', 'voyage', 'food', 'fitness', 'mode'],
        culture: ['culture', 'art', 'musique', 'photographie', 'créativité'],
        business: ['business', 'startup', 'marketing', 'productivité'],
        nature: ['nature', 'environnement', 'écologie', 'animaux'],
        general: ['inspiration', 'tips', 'tutorial', 'découverte', 'partage']
    };

    let selectedTheme = 'general';

    // Logique simple pour déterminer le thème basé sur le type de contenu
    if (contentType === 'image') {
        const themes = ['culture', 'lifestyle', 'nature'];
        selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    } else if (contentType === 'video') {
        const themes = ['culture', 'tech', 'lifestyle'];
        selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    } else if (contentType === 'text') {
        // Pour le texte, on peut analyser le contenu (simplifié)
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('tech') || lowerContent.includes('code') || lowerContent.includes('dev')) {
            selectedTheme = 'tech';
        } else if (lowerContent.includes('business') || lowerContent.includes('startup')) {
            selectedTheme = 'business';
        } else {
            const themes = ['lifestyle', 'culture', 'general'];
            selectedTheme = themes[Math.floor(Math.random() * themes.length)];
        }
    }

    const themeTags = tagsByTheme[selectedTheme] || tagsByTheme.general;
    
    // Retourner 1-3 tags de ce thème
    const numTags = Math.floor(Math.random() * 3) + 1;
    const shuffled = themeTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags);
};

module.exports = {
    seedTags,
    getRandomTagsForBlink,
    getThematicTags
};

// Exécuter le seeder si ce fichier est appelé directement
if (require.main === module) {
    seedTags()
        .then(() => {
            console.log('✅ Seeder des tags exécuté avec succès');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur lors de l\'exécution du seeder:', error);
            process.exit(1);
        });
}
