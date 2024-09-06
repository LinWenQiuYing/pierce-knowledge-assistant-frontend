<template>
  <a-layout class="knowledge-assistant-layout">
    <LayoutHeader />
    <a-layout-content class="knowledge-assistant-layout-content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>
<script>
import { Layout } from "ant-design-vue";
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import LayoutHeader from "./layoutHeader";

const { Content } = Layout;

export default {
  name: "Layout",
  components: {
    ALayout: Layout,
    ALayoutContent: Content,
    LayoutHeader,
  },
  setup() {
    const route = useRoute();
    const store = useStore();

    watch(
      () => route.path,
      (newValue) => {
        switch (newValue) {
          case "/overview":
            store.commit("setActiveKey", ["overview"]);
            break;
          case "/chat":
            store.commit("setActiveKey", ["chat"]);
            break;
          case "/read":
            store.commit("setActiveKey", ["read"]);
            break;
          case "/write":
            store.commit("setActiveKey", ["write"]);
            break;
          case "/search":
            store.commit("setActiveKey", ["search"]);
            break;
          case "/prompt":
          case "/resource":
            store.commit("setActiveKey", [""]);
            break;
        }
      },
      { immediate: true }
    );

    return {};
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
