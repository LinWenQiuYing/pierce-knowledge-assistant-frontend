<template>
  <a-config-provider :locale="locale">
    <router-view />
  </a-config-provider>
</template>

<script>
import { ConfigProvider } from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import { ref } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zhCN");

export default {
  name: "App",
  components: {
    AConfigProvider: ConfigProvider,
  },
  setup() {
    let locale = ref(zhCN);
    //console.log("env", process.env, process.env.VUE_APP_SERVICE_URL);

    return {
      locale,
    };
  },
};
</script>

<style lang="less">
@import "./assets/theme/index.less";
</style>
