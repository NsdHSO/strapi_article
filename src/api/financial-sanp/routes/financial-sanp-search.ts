export default {
  routes: [
    {
      method: 'GET',
      path: '/financial-sanps/search',
      handler: 'financial-sanp.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
