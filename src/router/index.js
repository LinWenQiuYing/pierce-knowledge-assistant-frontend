import store from "@/store";
import { message } from "ant-design-vue";
import { computed } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";

const layout = () => import("../layout");
const overview = () => import("../views/overview");
const chat = () => import("../views/chat");
const read = () => import("../views/read");
const write = () => import("../views/write");
const search = () => import("../views/search");
const resource = () => import("../views/resource");
const prompt = () => import("../views/prompt");
const login = () => import("../views/login");

const routes = [
  {
    path: "/",
    name: "layout",
    component: layout,
    redirect: "overview",
    children: [
      {
        path: "overview",
        name: "overview",
        component: overview,
      },
      {
        path: "chat",
        name: "chat",
        component: chat,
      },
      {
        path: "read",
        name: "read",
        component: read,
      },
      {
        path: "search",
        name: "search",
        component: search,
      },
      {
        path: "write",
        name: "write",
        component: write,
      },
      {
        path: "resource",
        name: "resource",
        component: resource,
      },
      {
        path: "prompt",
        name: "prompt",
        component: prompt,
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: login,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // next();
  const state = store.state.appStore;
  const userInfo = computed(() => state.userInfo);

  if (userInfo.value && userInfo.value.token) {
    if (to.path === "/login") {
      next("/");
    } else {
      next();
    }
  } else {
    if (to.path === "/login") {
      next();
    } else {
      message.error("登录超时，请重新登录！", 2);
      store.commit("setTarget", window.location.hash.split("#")[1]);
      next("/login");
    }
  }
});

export default router;
