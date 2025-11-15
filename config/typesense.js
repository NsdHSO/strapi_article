module.exports = ({ env }) => ({
    connection: {
        nodes: [
            {
                host: env('TYPESENSE_HOST', 'localhost'),
                port: env('TYPESENSE_PORT', '8108'),
                protocol: env('TYPESENSE_PROTOCOL', 'http')
            }
        ],
        apiKey: env('TYPESENSE_API_KEY', 'xyz'),
        connectionTimeoutSeconds: env('TYPESENSE_CONNECTION_TIMEOUT_SECONDS', 2)
    }
});
