const Typesense = require('typesense');

module.exports = () => ({
    client: null,

    initialize() {
        const config = strapi.config.get('typesense.connection');
        this.client = new Typesense.Client(config);
        return this;
    },

    async createCollection(schema) {
        try {
            return await this.client.collections().create(schema);
        } catch (error) {
            if (error.httpStatus === 409) {
                // Collection already exists
                return this.client.collections(schema.name).retrieve();
            }
            throw error;
        }
    },

    async indexDocument(collectionName, document) {
        return await this.client.collections(collectionName).documents().create(document);
    }
});
