export default {
  namespaced: "true",
  state: {
    referTitle: "", //参考文献标题
    referContent: "", //参考文献内容
    referTime: "", //参考文献上传时间
    referAuthor: "", //参考文献上传人
  },
  mutations: {
    setReferTitle(state, referTitle) {
      state.referTitle = referTitle;
    },
    setReferContent(state, referContent) {
      state.referContent = referContent;
    },
    setReferTime(state, referTime) {
      state.referTime = referTime;
    },
    setReferAuthor(state, referAuthor) {
      state.referAuthor = referAuthor;
    },
  },
  actions: {
    updateReferTitle(context, referTitle) {
      context.commit("setReferTitle", referTitle);
    },
    updateReferContent(context, referContent) {
      context.commit("setReferContent", referContent);
    },
    updateReferTime(context, referTime) {
      context.commit("setReferTime", referTime);
    },
    updateReferAuthor(context, referAuthor) {
      context.commit("setReferAuthor", referAuthor);
    },
  },
};
