/**
 * app全局变量
 */
import { getUserInfo } from "@/utils/common.js";

export default {
  namespace: "true",
  state() {
    return {
      userInfo: getUserInfo() || {},
      theme: {
        menuMode: "vertical",
        colorBackground: "#009999",
      },
      activeKey: ["overview"],
      target: "/", // 跳转到login之前的路由
    };
  },
  mutations: {
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo;
    },
    setTheme(state, theme) {
      state.theme = theme;
    },
    setActiveKey(state, key) {
      state.activeKey = key;
    },
    setTarget(state, target) {
      state.target = target;
    },
  },
  actions: {
    updateTheme(context, theme) {
      context.commit("theme", theme);
    },
    updateUserInfo(context, userInfo) {
      context.commit("userInfo", userInfo);
    },
  },
  getters: {
    theme(state) {
      return state.theme;
    },
    userInfo(state) {
      return state.userInfo;
    },
  },
};
