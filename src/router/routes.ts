export const routes = [
  {
    path: '/',
    redirect: '/list',
    component: () => import('@/layout/index.vue'),
    children: [
      // {
      //   path: 'home',
      //   component: () => import('@/views/home/index.vue'),
      //   meta: {
      //     title: 'tabbar.home',
      //     keepAlive: true,
      //   },
      // },
      {
        path: 'list',
        component: () => import('@/views/list/index.vue'),
        meta: {
          title: 'tabbar.list',
          keepAlive: true,
        },
      },
      {
        path: 'member',
        component: () => import('@/views/member/index.vue'),
        meta: {
          title: 'tabbar.member',
          keepAlive: true,
        },
      },
      {
        name: 'memberExchangeInfo',
        path: '/member/exchange',
        component: () => import('@/views/member/exchange/index.vue'),
        meta: {
          title: 'member.exchangeInfo',
          border: false,
        },
      },
      {
        name: 'memberExchangeDetails',
        path: '/member/exchange/details/:id',
        component: () => import('@/views/member/exchange/details.vue'),
        meta: {
          title: 'member.exchangeDetails',
          border: true,
        },
      },
      {
        name: 'memberExchangeCreate',
        path: '/member/exchange/create',
        component: () => import('@/views/member/exchange/create.vue'),
        meta: {
          title: 'member.exchangeCreate',
          border: true,
        },
      },
      {
        name: 'memberNoticeInfo',
        path: '/member/notice',
        component: () => import('@/views/member/notice/index.vue'),
        meta: {
          title: 'member.noticeInfo',
          border: false,
        },
      },
      {
        name: 'memberAbout',
        path: '/member/about',
        component: () => import('@/views/member/about/index.vue'),
        meta: {
          title: 'member.about',
          border: false,
        },
      },
      {
        name: 'memberAccount',
        path: '/member/account',
        component: () => import('@/views/member/account/index.vue'),
        meta: {
          title: 'member.account',
          border: true,
        },
      },
      {
        name: 'listDetails',
        path: '/details',
        component: () => import('@/views/list/details/index.vue'),
        meta: {
          title: 'list.details',
          border: false,
        },
      },
      {
        name: 'create',
        path: '/create',
        component: () => import('@/views/list/strategy/index.vue'),
        meta: {
          title: 'list.create',
          border: false,
        },
      },
      {
        name: 'use',
        path: 'use',
        component: () => import('@/views/home/details.vue'),
        meta: {
          title: 'home.details',
          keepAlive: true,
        },
      },
      {
        name: 'privacy',
        path: '/privacy',
        component: () => import('@/views/privacy/index.vue'),
        meta: {
          title: 'privacy.title',
          border: true,
        },
      },
      {
        name: 'agreement',
        path: '/agreement',
        component: () => import('@/views/login/agreement.vue'),
        meta: {
          title: 'member.agreement',
          keepAlive: true,
          border: true,
        },
      },
      {
        name: 'login',
        path: '/login',
        component: () => import('@/views/login/index.vue'),
        meta: {
          title: 'member.login',
          keepAlive: true,
        },
      },
      {
        name: 'register',
        path: '/register',
        component: () => import('@/views/register/index.vue'),
        meta: {
          title: 'register.title',
          keepAlive: true,
        },
      },
    ],
  },
  // 匹配不到重定向会主页
  {
    // 找不到路由重定向到 404 页面
    path: '/:pathMatch(.*)',
    redirect: '/list',
  },
];

export default routes;
