export default {
  routes: [
    {
      method: 'GET',
      path: '/homes/search',
      handler: 'home.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
