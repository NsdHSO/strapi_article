export default {
  routes: [
    {
      method: 'POST',
      path: '/financial-sanps/reindex',
      handler: 'financial-sanp.reindex',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
        middlewares: [],
      },
    },
  ],
};
