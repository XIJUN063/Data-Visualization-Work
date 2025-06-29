import { createMemoryHistory, createRouter } from 'vue-router';
import Index from '../components/Index.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', redirect: '/index' },
    {
      path: '/index',
      component: Index,
      redirect: '/user',
      children: [
        {
          path: '/user',
          component: () => import('../components/subcomponents/footballer.vue'),
        },
        {
          path: '/order',

          component: () => import('../components/subcomponents/matchdata.vue'),
        },
      ],
    },
  ],
});
export default router;
