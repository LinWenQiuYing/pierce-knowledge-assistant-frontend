<template>
  <div class="write-content">
    <div class="write-right-result">
      <div class="result-title">本次创作结果</div>
      <div class="result-content">
        <div v-if="meet.loading" class="loading">正在查询中请稍后......</div>
        <div
          ref="resultContent"
          class="result-content-text"
          v-html="meet.message"
          v-else-if="!meet.loading && meet.message"
        />
        <div class="result-content-text no-content" v-else>
          暂无创作内容，请在左侧进行创作配置！
        </div>
      </div>
      <div class="result-des" v-show="meet.message">
        <div class="result-des-left" v-if="meet.isCreating" @click="stopCreate">
          停止生成
        </div>
        <div class="result-des-left" v-else @click="reCreate">重新生成</div>
        <div class="result-des-right">
          <a-tooltip placement="top" title="复制">
            <copy-outlined @click="handleCopy(meet.message)" />
          </a-tooltip>
          <a-divider type="vertical" />
          <a-tooltip placement="top" title="踩">
            <dislike-outlined
              :class="isDown ? 'active' : ''"
              @click="handleDown"
            />
          </a-tooltip>
          <a-divider type="vertical" />
          <a-tooltip placement="top" title="赞">
            <like-outlined :class="isUp ? 'active' : ''" @click="handleUp" />
          </a-tooltip>
        </div>
      </div>
    </div>
    <div class="write-right-history">
      <div class="history-title">创作历史</div>
      <div class="history-detail" v-if="meet.history.length">
        <div
          class="detail-item"
          v-for="(item, index) in meet.history"
          :key="index"
        >
          <div class="detail-item-top">
            <div class="top-content" v-html="item.title" />
            <div class="top-action" @click="handleCheckDetail(item)">查看</div>
          </div>
          <div class="detail-item-bottom">{{ item.time }}</div>
        </div>
      </div>
      <div class="history-detail" v-else>暂无创作历史</div>
    </div>
  </div>
  <a-modal
    v-model:visible="isModalVisible"
    title="创作历史"
    :width="1000"
    wrapClassName="history-modal"
    centered
    :footer="null"
  >
    <div class="history-modal-content" v-html="historyDetail"></div>
  </a-modal>
</template>

<script>
import { handleCopy, scrollToBottom } from "@/utils/common";
import { Divider, Modal, Tooltip } from "ant-design-vue";
import { reactive, ref, toRefs, watch } from "vue";

export default {
  name: "WriteContent",
  components: {
    ADivider: Divider,
    AModal: Modal,
    ATooltip: Tooltip,
  },
  props: {
    meet: {
      type: Object,
      required: true,
    },
  },
  emits: ["stopCreate", "sseListener"],
  setup(props, { emit }) {
    const writeResult = reactive({
      isModalVisible: false, // 历史记录弹窗是否显示
      historyDetail: null,
      resultContent: null, // 创作结果dom
    });

    const handleCheckDetail = (item) => {
      writeResult.isModalVisible = true;
      writeResult.historyDetail = item.content;
    };

    watch(
      () => props.meet.message,
      (val) => {
        if (val) {
          scrollToBottom(writeResult.resultContent, 20);
        }
      }
    );

    // 停止回答
    const stopCreate = () => {
      emit("stopCreate");
    };

    // 重新生成
    const reCreate = function () {
      emit("sseListener");
    };

    //踩、赞
    const isDown = ref(false);
    const isUp = ref(false);
    const handleDown = () => {
      isDown.value = !isDown.value;
    };
    const handleUp = () => {
      isUp.value = !isUp.value;
    };

    return {
      ...toRefs(writeResult),
      handleCheckDetail,
      handleCopy,
      props,
      stopCreate,
      reCreate,
      isDown,
      isUp,
      handleDown,
      handleUp,
    };
  },
};
</script>
<style lang="less">
@import url(./index.less);
</style>
