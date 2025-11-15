export default ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      // Enable playground in non-production environments
      playground: env('NODE_ENV') !== 'production',
      // Depth limit to prevent overly complex queries
      apolloServer: {
        introspection: true,
      },
      // Default amount limits for query complexity; adjust to your needs
      defaultLimit: 20,
      maxLimit: 100,
    },
  },
});