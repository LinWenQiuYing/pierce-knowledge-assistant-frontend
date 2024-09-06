<template>
  <div class="detail-right">
    <!-- <a-spin
      class="detail-right-load"
      v-if="detail.isRightLoading"
      tip="正在加载"
      size="large"
    /> -->
    <div class="top">
      <div class="top-title">AI对话</div>
      <div class="top-body">
        <div class="right-container" v-if="detail.isRightLoading">
          正在查询中，请稍后......
        </div>
        <div class="right-container" v-else>
          <div
            class="context"
            style="white-space: pre-line"
            v-html="chat.content.message"
          ></div>
          <div
            class="des"
            v-if="
              retrieval_backtrack &&
              retrieval_backtrack.retrieval_results.length
            "
          >
            <div class="name">信息来源：</div>
            <div class="content">
              <div
                class="content-item"
                v-for="(type, $index) in filenameFilter(
                  retrieval_backtrack.retrieval_results
                )"
                :key="$index"
                @click="
                  openHtml(
                    JSON.parse(type.metadata).file ||
                      JSON.parse(type.metadata).filename ||
                      JSON.parse(type.metadata).object_name
                  )
                "
              >
                <a-tooltip
                  placement="topLeft"
                  :title="
                    JSON.parse(type.metadata).file ||
                    JSON.parse(type.metadata).filename ||
                    JSON.parse(type.metadata).object_name
                  "
                  overlayClassName="refer-tooltip"
                >
                  {{ $index + 1 }}.{{
                    JSON.parse(type.metadata).file ||
                    JSON.parse(type.metadata).filename ||
                    JSON.parse(type.metadata).object_name
                  }}
                </a-tooltip>
              </div>
            </div>
          </div>
        </div>
        <div
          class="right-action"
          v-if="!chat.abortController && !detail.isRightLoading"
        >
          <div class="restart" @click="reStart">重新生成</div>
          <div class="right-action-img">
            <a-tooltip placement="top" title="复制">
              <copy-outlined @click="copy(chat.content.message)" />
            </a-tooltip>
            <!-- <a-divider type="vertical" />
            <a-tooltip placement="top" title="踩">
              <dislike-outlined
                :class="isDown ? 'active' : ''"
                @click="handleDown"
              />
            </a-tooltip>
            <a-divider type="vertical" />
            <a-tooltip placement="top" title="赞">
              <like-outlined :class="isUp ? 'active' : ''" @click="handleUp" />
            </a-tooltip> -->
          </div>
        </div>
        <div class="right-button">
          <a-button @click="continueChat">继续聊天</a-button>
        </div>
      </div>
    </div>
  </div>

  <a-modal
    v-model:visible="viewHtmlDialog"
    :title="viewHtmlFileName"
    width="50%"
    wrap-class-name="full-modal"
    centered
    :footer="null"
  >
    <!-- <p>Some contents...</p> -->
    <div class="backTop" @click="backTop">
      <i class="backTop-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <path fill="currentColor" d="M512 320 192 704h639.936z"></path>
        </svg>
      </i>
    </div>
    <div class="modal-content" v-if="chat.content" ref="viewHtmlDialogDom">
      <div class="modal-content-top">
        <div
          class="modal-content-top-item"
          :key="index"
          v-for="(item, index) in chat.content.retrieval_backtrack_detail
            .retrieval_results[viewHtmlFileNameText]"
          @click="scrollIntoView(index)"
        >
          <span class="index" :class="`mark_${index}`">{{ index + 1 }}</span>
          <span>{{ item.text }}</span>
        </div>
      </div>
      <div class="modal-content-bottom">
        <div class="bottom-title">{{ viewHtmlFileName }}</div>
        <div
          class="bottom-body"
          v-if="
            chat.content.retrieval_backtrack_detail
              .retrieval_backstrack_results[viewHtmlFileName]
          "
        >
          <div
            v-html="
              chat.content.retrieval_backtrack_detail
                .retrieval_backstrack_results[viewHtmlFileName].text
            "
          ></div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script>
import { handleCopy } from "@/utils/common.js";
import { Button, Modal, Tooltip } from "ant-design-vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
export default {
  name: "DetailRight",
  components: {
    ATooltip: Tooltip,
    //ADivider: Divider,
    AButton: Button,
    //ASpin: Spin,
    AModal: Modal,
  },
  props: ["chat", "retrieval_backtrack", "detail"],
  emits: ["sendMessage", "changeRetrieval"],
  setup(props, { emit }) {
    //滤出文件名
    const filenameFilter = function (retrieval_results) {
      const filenamelist = [];
      const res = [];
      retrieval_results.forEach((item) => {
        const filename = JSON.parse(item.metadata).file;
        if (filenamelist.indexOf(filename) > -1) {
          return;
        } else {
          filenamelist.push(filename);
          res.push(item);
        }
      });
      return res;
    };

    //------点击参考文献内容预览
    const viewHtmlDialog = ref(false); //展示参考文献内容的弹框
    const viewHtmlFileName = ref(""); //参考文献名称
    const viewHtmlFileNameText = ref(""); //正则处理后的参考文献
    const openHtml = (filename) => {
      viewHtmlFileName.value = filename;
      viewHtmlFileNameText.value = filename.split("/").pop()
        ? filename.split("/").pop()
        : filename;
      // console.log(viewHtmlFileName.value, viewHtmlFileNameText.value);
      if (
        props.chat.content.retrieval_backtrack_detail
          .retrieval_backstrack_results[filename]
      ) {
        emit("changeRetrieval", filename);
      }
      viewHtmlDialog.value = true;
    };

    //点击引用到的参考文献段落，在全文对匹配内容进行高亮显示以及页面滑动定位到第一处的位置
    const scrollIntoView = (index) => {
      document.querySelector(`.mark.mark_${index}`).scrollIntoView();
    };
    //点击回到表头
    const viewHtmlDialogDom = ref(null);
    const backTop = () => {
      viewHtmlDialogDom.value.scrollTop = 0;
    };

    //点击重新生成按钮
    const reStart = () => {
      emit("sendMessage");
    };

    //踩、赞
    const isDown = ref(false);
    const isUp = ref(false);
    const handleDown = () => {
      isDown.value = !isDown.value;
      isUp.value = !isDown.value;
    };
    const handleUp = () => {
      isUp.value = !isUp.value;
      isDown.value = !isUp.value;
    };

    //复制
    const copy = (value) => {
      console.log(value);
      //！！！<sup class="word" > 有一个空格，千万别删，就这个匹配
      let pattern = /(<sup class="word" >[^<]+<\/sup>)/g; // 匹配<sup class="word" >...</sup>标签
      let replacedText = value.replace(pattern, ""); // 替换匹配到的标签为''
      replacedText = replacedText.replace(/<\/?[^>]+>/g, ""); // 删除其他HTML标签
      handleCopy(replacedText);
    };

    const router = useRouter();
    //继续聊天
    const continueChat = () => {
      router.push("/chat");
    };

    return {
      copy,
      reStart,
      isDown,
      isUp,
      handleDown,
      handleUp,

      filenameFilter,
      continueChat,

      //点击参考文献内容预览
      viewHtmlDialog,
      viewHtmlFileName,
      viewHtmlFileNameText,
      openHtml,
      scrollIntoView,
      viewHtmlDialogDom,
      backTop,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
