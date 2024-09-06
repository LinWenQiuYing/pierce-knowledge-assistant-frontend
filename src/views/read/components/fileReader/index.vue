<template>
  <div class="file-reader" ref="fileReader">
    <div class="file-reader-header">
      <span class="header-title">{{ currentFile.title }}</span>
      <div class="header-tools">
        <div class="header-tools-size">
          <minus-circle-outlined class="size-btn" @click="handleZoomOut" />
          <span class="size-text">{{ size }}%</span>
          <plus-circle-outlined class="size-btn" @click="handleZoomIn" />
        </div>
        <a-input
          allow-clear
          v-model:value.trim="searchValue"
          placeholder="请输入"
          class="header-tools-search"
          @change="handleInputChange"
        >
          <template #prefix>
            <search-outlined />
          </template>
        </a-input>
        <img
          src="@/assets/images/img/icon-robot.png"
          alt=""
          class="header-tools-robot"
          @click="handleReadFile"
        />
        <close-outlined class="header-tools-close" @click="handleCloseReader" />
      </div>
    </div>
    <div
      class="file-reader-content"
      ref="fileContent"
      @contextmenu="handleContextMenu"
    >
      <Docx v-if="fileType === 'docx'" :src="src" :docxLoading="loading" />
      <Csv v-else-if="fileType === 'csv'" :src="src" :csvLoading="loading" />
      <Excel
        v-else-if="fileType === 'xlsx'"
        :src="src"
        :excelLoading="loading"
      />
      <Pdf
        v-else-if="fileType === 'pdf'"
        :src="src"
        :pdfLoading="loading"
        ref="pdfContent"
      />
      <Txt v-else-if="fileType === 'txt'" :src="src" :txtLoading="loading" />
      <iframe v-else :src="src" width="100%" height="100%" frameborder="0" />
      <!-- type="application/pdf" -->
    </div>
    <div class="file-reader-tools" v-if="src && fileType === 'pdf'">
      <span class="tools-btn" @click="handleChangePage('pre')">上一页</span>
      <span>{{ current }}/{{ total }}</span>
      <span class="tools-btn" @click="handleChangePage('next')">下一页</span>
      <span
        >跳至<a-input
          v-model:value.trim="skipPage"
          class="skip"
          @pressEnter="handleSkipPage"
        />页</span
      >
    </div>
    <RightMenu
      :show="rightMenuShow"
      @onMenuClick="onMenuClick"
      :contextMenuData="contextMenuData"
    />
    <a-drawer
      width="calc((100% - 288px) / 2)"
      :mask="false"
      placement="right"
      :closable="false"
      class="file-reader-drawer"
      :visible="drawerVisible"
      @close="onClose"
      :getContainer="fileReader"
    >
      <template #title>
        <close-outlined class="title-close" @click="onClose" />
        <img
          src="@/assets/images/img/icon-robot.png"
          alt=""
          class="title-img"
        />
        <span class="title-text">AI速读</span>
      </template>
      <div
        class="content-item"
        v-for="(item, index) in contentList"
        :key="index"
      >
        <div class="content-item-header">
          <div class="header-left">
            <img :src="item.icon" alt="" class="header-icon" />
            <span class="header-title">{{ item.title }}</span>
          </div>
          <img
            alt=""
            class="header-fold"
            src="@/assets/images/img/down.svg"
            v-if="item.isFold"
            @click="item.isFold = false"
          />
          <img
            alt=""
            class="header-fold"
            src="@/assets/images/img/up.svg"
            v-else
            @click="item.isFold = true"
          />
        </div>
        <div class="content-item-content" v-show="!item.isFold">
          {{ item.content }}
        </div>
        <div class="content-item-footer" v-show="!item.isFold">
          <a-tooltip placement="top" title="复制">
            <img
              alt="copy"
              class="footer-img"
              src="@/assets/images/img/copy.svg"
              @click="handleCopy(item.content)"
            />
          </a-tooltip>
          <!-- <a-divider type="vertical" />
          <a-tooltip placement="top" title="分享">
            <img
              alt="share"
              class="footer-img"
              src="@/assets/images/img/share.svg"
            />
          </a-tooltip> -->
        </div>
      </div>
    </a-drawer>
  </div>
</template>
<script>
import RightMenu from "@/components/rightMenu";
import { downloadRes } from "@/shared/api/resource.js";
import { handleCopy } from "@/utils/common.js";
import { Drawer, Input, Tooltip, message } from "ant-design-vue";
import { debounce } from "lodash";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";
import Csv from "./csv";
import Docx from "./docx";
import Excel from "./excel";
import Pdf from "./pdf";
import Txt from "./txt";

export default {
  name: "FileReader",
  props: {
    currentFile: {
      require: true,
      type: Object,
    },
  },
  emits: ["changeReaderShow", "changeCopyContent", "handlePosition"],
  components: {
    //ADivider: Divider,
    ADrawer: Drawer,
    AInput: Input,
    ATooltip: Tooltip,
    Csv,
    Docx,
    Excel,
    Pdf,
    RightMenu,
    Txt,
  },
  setup(props, { emit }) {
    const params = reactive({
      searchValue: undefined, // 搜索关键词
      size: 100,
      fileType: "",
      loading: false,
      src: undefined, // 文件地址 || 文件流(pdf)
      fileReader: null,
      pdfContent: null,
      fileContent: null,
      skipPage: undefined,
      current: 1,
      rightMenuShow: false,
      contentList: [
        {
          title: "摘要",
          isFold: false,
          icon: require("@/assets/images/img/doc.svg"),
          content:
            "这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要这是一段摘要。",
        },
        {
          title: "总结",
          isFold: false,
          icon: require("@/assets/images/img/icon-conclusion.svg"),
          content:
            "这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段总结，这是一段",
        },
      ],
    });

    const sizeOption = [
      25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300,
    ]; // 放大缩小的比例可选数组

    let copyText = ""; // 待复制的文本
    const contextMenuData = reactive({
      position: {
        x: 0,
        y: 0,
      },
      context: [
        {
          title: "选中文本进行提问",
          key: "copy",
          show: true,
        },
      ],
    });

    const total = computed(() => {
      return (params.pdfContent && params.pdfContent.numPages) || 0;
    });

    // 初始化方法-获取文件地址或者文件流
    const handleInit = async () => {
      params.src = ""; // 重置src
      params.fileType = props.currentFile.type;
      params.loading = true;
      const res = await downloadRes(props.currentFile.url);
      params.loading = false;
      let blob = null;
      if (params.fileType === "pdf") {
        // pdf以文件流获取
        blob = new Blob([res], { type: "application/pdf" });
      } else if (params.fileType === "doc") {
        // todo
        // message.info("暂不支持doc文件预览，敬请期待！");
        handleCloseReader();
      } else {
        blob = new Blob([res], {
          type: "application/octet-stream;charset=UTF-8",
        });
      }
      params.src = URL.createObjectURL(blob);
    };

    // 关闭阅读器
    const handleCloseReader = () => {
      emit("changeReaderShow", false);
    };

    // 缩小
    const handleZoomOut = () => {
      const index = sizeOption.indexOf(params.size);
      if (index > 0) {
        params.size = sizeOption[index - 1];
        params.fileContent.style.zoom = parseFloat(params.size / 100).toFixed(
          2
        );
      }
    };

    // 放大
    const handleZoomIn = () => {
      const index = sizeOption.indexOf(params.size);
      if (index < 14) {
        params.size = sizeOption[index + 1];
        params.fileContent.style.zoom = parseFloat(params.size / 100).toFixed(
          2
        );
      }
    };

    // 修改搜索关键词--防抖
    const handleInputChange = debounce(async () => {
      // 移除之前的高亮
      const lowerCaseSearchValue = params.searchValue.toLowerCase();
      const reg1 = new RegExp(
        `<span class="highlight">${lowerCaseSearchValue}</span>`,
        "g"
      );
      const reg2 = new RegExp(lowerCaseSearchValue, "g");
      const highlightedElements = document.querySelectorAll(".highlight");
      highlightedElements.forEach((element) => {
        const parentNode = element.parentNode;
        if (!parentNode) return;
        let innerText = parentNode.innerText;
        innerText = innerText.replace(reg1, lowerCaseSearchValue);
        parentNode.innerHTML = innerText;
      });

      // 如果searchValue的值不存在，则不执行后面代码
      if (!params.searchValue) return;
      if (params.fileType === "xlsx") {
        return message.info("暂不支持excel表格搜索，敬请期待！");
      }
      // 遍历文档中的文本节点，查找匹配的文本
      const array = [];
      const tags = params.fileContent.getElementsByTagName("*");
      for (var i = 0; i < tags.length; i++) {
        if (
          tags[i].nodeName.toLowerCase() !== "script" &&
          tags[i].nodeName.toLowerCase() !== "style" &&
          tags[i].children &&
          !tags[i].children.length &&
          tags[i].innerText
        ) {
          // 过滤script、style标签 和 非纯文本的父节点
          /*
            如果节点是元素节点，则 nodeType 属性将返回 1。
            如果节点是属性节点，则 nodeType 属性将返回 2。
            如果节点是文本节点，则 nodeType 属性将返回 3。
            如果节点是注释节点，则 nodeType 属性将返回 8。
          */
          const lowerCaseText = tags[i].innerText.toLowerCase();
          if (lowerCaseText.includes(lowerCaseSearchValue)) {
            // 高亮匹配的文本
            array.push(tags[i]);
          }
        }
      }
      console.log("array", array, lowerCaseSearchValue);
      array.map((textNode) => {
        let lowerCaseText = textNode.innerText.toLowerCase();
        lowerCaseText = lowerCaseText.replace(
          reg2,
          `<span class="highlight">${lowerCaseSearchValue}</span>`
        );
        textNode.innerHTML = lowerCaseText;
      });
    }, 500);

    // 上一页、下一页
    const handleChangePage = (type) => {
      if (type === "pre" && params.current > 1) {
        params.current -= 1;
        params.pdfContent.handleRender(params.current);
      } else if (type === "next" && params.current < total.value) {
        params.current += 1;
        params.pdfContent.handleRender(params.current);
      }
    };

    // 跳转页码
    const handleSkipPage = () => {
      if (params.skipPage > 0 && params.skipPage <= total.value) {
        params.current = parseInt(params.skipPage);
        params.pdfContent.handleRender(params.current);
      }
      params.skipPage = undefined;
    };

    // 右击菜单
    const handleContextMenu = (evt) => {
      params.rightMenuShow = true;
      evt.stopPropagation();
      evt.preventDefault();
      contextMenuData.position = {
        x: evt.pageX - 300,
        y: evt.pageY - 70,
      };
      const selection = document.getSelection();
      copyText = selection.toString();
    };

    // 点击菜单
    const onMenuClick = (key) => {
      switch (key) {
        default:
          if (copyText) {
            handleCopy(copyText);
            emit("changeCopyContent", copyText);
          } else {
            message.info("请先选中想选中的文本！");
          }
          break;
      }
    };

    // 关闭右键菜单
    const closeRightMenu = () => {
      params.rightMenuShow = false;
    };

    const drawerVisible = ref(false);
    // 点击阅读文章
    const handleReadFile = () => {
      message.info("AI速读功能正在开发，敬请期待！");
      // drawerVisible.value = true;
    };
    const onClose = () => {
      drawerVisible.value = false;
    };

    onMounted(() => {
      document.addEventListener("click", closeRightMenu);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("click", closeRightMenu);
    });

    watch(
      props,
      async () => {
        handleInit();
        params.searchValue = undefined;
      },
      { immediate: true }
    );

    return {
      ...toRefs(params),
      total,
      drawerVisible,
      contextMenuData,
      ...toRefs(props),

      onClose,
      handleCopy,
      onMenuClick,
      handleZoomIn,
      handleZoomOut,
      handleSkipPage,
      handleReadFile,
      handleChangePage,
      handleInputChange,
      handleContextMenu,
      handleCloseReader,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
