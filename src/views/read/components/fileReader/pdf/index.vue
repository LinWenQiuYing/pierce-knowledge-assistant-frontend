<template>
  <a-spin tip="正在加载" v-if="loading" class="file-reader-loading" />
  <div class="file-pdf" ref="filePdf">
    <div class="file-pdf-content">
      <canvas id="the-canvas"></canvas>
    </div>
  </div>
</template>
<script>
import { Spin } from "ant-design-vue";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.entry";
import { TextLayerBuilder } from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";
import { computed, onBeforeUnmount, ref, toRefs, watch } from "vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default {
  name: "Pdf",
  props: {
    src: {
      type: String,
      require: true,
    },
    pdfLoading: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    ASpin: Spin,
  },
  setup(props, { emit }) {
    const numPages = ref(0);
    const isDestory = ref(false);
    const loading = computed({
      get: () => {
        return props.pdfLoading;
      },
      set: (newVal) => {
        emit("update:pdfLoading", newVal);
      },
    });
    const filePdf = ref(null);

    let pdfData = null; // pdf对象
    const loadFile = async (url) => {
      pdfData = pdfjsLib.getDocument({
        url: url,
        cMapUrl: "./cmaps/",
        cMapPacked: true,
        enableXfa: true,
      });
      handleRender(1);
      // for (let i = 1; i <= numPages.value; i++) {
      //   handleRender(i);
      // }
    };

    // 渲染pdf
    const handleRender = async (num) => {
      loading.value = true;
      pdfData.promise.then((pdf) => {
        numPages.value = pdf.numPages;

        pdf.getPage(num).then(async (page) => {
          const scale = 1;
          const viewport = page.getViewport({ scale: scale });
          const canvas = document.getElementById(`the-canvas`);
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          const renderTask = page.render(renderContext);
          await renderTask.promise
            .then(() => {
              if (isDestory.value) return;
              return page.getTextContent();
            })
            .then((textContent) => {
              if (isDestory.value) return;
              renderText(textContent, canvas, page, viewport);
              loading.value = false;
            });
        });
      });
    };

    const renderText = (textContent, canvas, page, viewport) => {
      // 清除之前创建的textLayer
      const textLayerElements = document.querySelectorAll(".textLayer");
      textLayerElements.forEach((element) => {
        element.parentNode.removeChild(element);
      });

      // 创建textLayer元素
      const textLayerDiv = document.createElement("div");
      textLayerDiv.setAttribute("class", "textLayer");
      textLayerDiv.style.width = `${canvas.width}px`;
      textLayerDiv.style.height = `${canvas.height}px`;

      // 将文本图层div添加至每页pdf的div中
      const pageDom = canvas.parentNode;
      pageDom.appendChild(textLayerDiv);

      // 创建新的TextLayerBuilder实例
      const textLayer = new TextLayerBuilder({
        textLayerDiv,
        pageIndex: page.pageIndex,
        viewport,
      });

      textLayer.setTextContent(textContent);

      textLayer.render();
    };

    watch(
      () => props.src,
      () => {
        if (props.src) {
          loadFile(props.src);
        }
      },
      { immediate: true }
    );

    onBeforeUnmount(() => {
      isDestory.value = true;
    });

    return {
      numPages,
      loading,
      filePdf,
      ...toRefs(props),

      handleRender,
    };
  },
};
</script>
<style lang="less" scoped></style>
