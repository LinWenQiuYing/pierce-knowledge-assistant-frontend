import { createStore } from "vuex";
import appStore from "./modules/appStore";
import referStore from "./modules/referStore";

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    appStore,
    referStore,
  },
});
