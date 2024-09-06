import { createApp, h } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import IconSvg from "@/components/IconSvg";
import * as Icons from "@ant-design/icons-vue";
import "./assets/images/index";

// 导入图片预加载方法以及图片列表
import { imgsPreloader } from "@/utils/imgPreloader.js";
import imgPreloaderList from "@/utils/imgPreloaderList.js";

(async () => {
  await imgsPreloader(imgPreloaderList);
  // 关闭加载弹框
  document.querySelector(".app-loading").style.display = "none";

  const app = createApp({
    render: () => h(App),
  });
  app.component("icon-svg", IconSvg);

  // 注册图标组件
  for (const i in Icons) {
    app.component(i, Icons[i]);
  }

  app.use(ElementPlus).use(store).use(router).mount("#app");
})();
