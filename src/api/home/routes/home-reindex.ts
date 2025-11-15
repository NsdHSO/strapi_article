export default {
  routes: [
    {
      method: 'POST',
      path: '/homes/reindex',
      handler: 'home.reindex',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
        middlewares: [],
      },
    },
  ],
};
