/**
 * Configuration Swagger pour la documentation de l'API
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const { logger } = require('../utils/logger.utils');

// Charger le fichier YAML principal de configuration Swagger
const mainSpecPath = path.join(__dirname, '../../docs/swagger/index.yaml');
const mainSpecYaml = fs.readFileSync(mainSpecPath, 'utf8');
const mainSpec = YAML.parse(mainSpecYaml);

// Charger les fichiers YAML des chemins
const pathsDir = path.join(__dirname, '../../docs/swagger/paths');
const pathFiles = fs.readdirSync(pathsDir).filter(file => file.endsWith('.yaml'));

// Charger les fichiers YAML des schémas depuis le dossier components
const schemasDir = path.join(__dirname, '../../docs/swagger/components/schemas');
const schemaFiles = fs.readdirSync(schemasDir).filter(file => file.endsWith('.yaml'));

// Charger les fichiers YAML des réponses communes
const responsesDir = path.join(__dirname, '../../docs/swagger/components/responses');
const responseFiles = fs.readdirSync(responsesDir).filter(file => file.endsWith('.yaml'));

/**
 * Charge les fichiers YAML et les fusionne en une seule spécification
 * @returns {Object} Spécification Swagger complète
 */
function loadSwaggerSpec() {
    // Créer une copie de la spécification principale
    const fullSpec = { ...mainSpec };
    fullSpec.paths = {};
    fullSpec.components = { schemas: {}, responses: {}, securitySchemes: {} };

    // Ajouter les chemins
    for (const file of pathFiles) {
        const filePath = path.join(pathsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const pathSpec = YAML.parse(content);

        if (pathSpec.paths) {
            Object.assign(fullSpec.paths, pathSpec.paths);
        }
    }

    // Ajouter les schémas depuis components/schemas
    for (const file of schemaFiles) {
        const filePath = path.join(schemasDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const schemaSpec = YAML.parse(content);

        if (schemaSpec.components && schemaSpec.components.schemas) {
            Object.assign(fullSpec.components.schemas, schemaSpec.components.schemas);
        }

        if (schemaSpec.components && schemaSpec.components.securitySchemes) {
            Object.assign(fullSpec.components.securitySchemes, schemaSpec.components.securitySchemes);
        }
    }

    // Ajouter les réponses communes depuis components/responses
    for (const file of responseFiles) {
        const filePath = path.join(responsesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const responseSpec = YAML.parse(content);

        if (responseSpec.components && responseSpec.components.responses) {
            Object.assign(fullSpec.components.responses, responseSpec.components.responses);
        }

        if (responseSpec.components && responseSpec.components.schemas) {
            Object.assign(fullSpec.components.schemas, responseSpec.components.schemas);
        }

        if (responseSpec.components && responseSpec.components.securitySchemes) {
            Object.assign(fullSpec.components.securitySchemes, responseSpec.components.securitySchemes);
        }
    }

    return fullSpec;
}

/**
 * Initialise Swagger dans l'application Express
 * @param {Object} app - Application Express
 */
function initializeSwagger(app) {
    // Options pour swagger-jsdoc (pour les annotations dans le code)
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Blinker API Documentation',
                version: '2.0.0',
                description: 'Documentation de l\'API Blinker avec réponses standardisées',
            },
        },
        // Chemins vers les fichiers contenant des annotations JSDoc pour Swagger
        apis: [
            path.join(__dirname, '../route/*.standardized.js'),
            path.join(__dirname, '../models/*.js'),
        ],
    };

    // Initialiser swagger-jsdoc pour les annotations
    const annotationSpecs = swaggerJsdoc(options);

    // Charger la spécification complète depuis les fichiers YAML
    const yamlSpecs = loadSwaggerSpec();

    // Fusionner les spécifications
    const mergedSpecs = {
        ...yamlSpecs,
        paths: {
            ...yamlSpecs.paths,
            ...annotationSpecs.paths,
        },
        components: {
            ...yamlSpecs.components,
            ...annotationSpecs.components,
            schemas: {
                ...yamlSpecs.components?.schemas,
                ...annotationSpecs.components?.schemas,
            },
            securitySchemes: {
                ...yamlSpecs.components?.securitySchemes,
                ...annotationSpecs.components?.securitySchemes,
            },
        },
    };

    // Configurer les routes Swagger
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSpecs));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(mergedSpecs);
    });

    logger.info('Documentation Swagger initialisée sur /api-docs');
}

module.exports = {
    initializeSwagger,
};
