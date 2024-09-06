<template>
  <div class="question-item">
    <div class="question-item-left">
      <div class="question-item-context" v-html="question"></div>
      <div class="question-item-img">
        <a-tooltip placement="top" title="新增prompt">
          <plus-circle-outlined @click="handleAddPrompt" />
        </a-tooltip>
        <a-divider type="vertical" />
        <a-tooltip placement="top" title="复制">
          <copy-outlined @click="copy(question)" />
        </a-tooltip>
        <!-- <a-divider type="vertical" />
        <a-tooltip placement="top" title="删除">
          <delete-outlined @click="handleDelete(question)" />
        </a-tooltip> -->
      </div>
    </div>

    <img alt="person" class="img" src="@/assets/images/img/person.svg" />
  </div>

  <a-modal
    v-model:visible="isPromptShow"
    title="新增prompt"
    @ok="promptConfirm"
    @cancel="promptCancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="600px"
    class="prompt-modal"
    :maskClosable="false"
  >
    <div class="prompt-modal-content">
      <div class="item">
        <div class="name">名称：</div>
        <a-input v-model:value.trim="promptName" placeholder="请输入名称" />
      </div>
      <div class="item">
        <div class="name">prompt：</div>
        <a-textArea
          v-model:value.trim="promptContent"
          placeholder="请输入prompt"
          allow-clear
          :auto-size="{ minRows: 4, maxRows: 4 }"
        />
      </div>
    </div>
  </a-modal>
</template>

<script>
import { addPrompt } from "@/shared/api/prompt";
import { handleCopy } from "@/utils/common";
import { Divider, Input, Modal, Tooltip, message } from "ant-design-vue";
import { ref } from "vue";
const { TextArea } = Input;

export default {
  name: "Person",
  components: {
    ATooltip: Tooltip,
    AInput: Input,
    ATextArea: TextArea,
    AModal: Modal,
    ADivider: Divider,
  },
  props: ["question"],
  emits: ["updatePromptList"],
  setup(props, { emit }) {
    //------新增prompt
    const promptName = ref("");
    const promptContent = ref("");
    const isPromptShow = ref(false);
    const handleAddPrompt = () => {
      isPromptShow.value = true;
    };
    //取消
    const promptCancel = () => {
      promptName.value = "";
      promptContent.value = "";
    };
    //确定
    const promptConfirm = async () => {
      if (!promptName.value.trim()) {
        return message.warning("请输入新增prompt的名称！");
      }
      if (!promptContent.value.trim()) {
        return message.warning("请输入新增prompt的内容！");
      }
      const json = {
        promptName: promptName.value.trim(),
        prompt: promptContent.value.trim(),
      };
      const res = await addPrompt(json);
      if (res.message === "成功") {
        message.success("新增prompt成功！", 1);
        emit("updatePromptList");
        isPromptShow.value = false;
      } else {
        message.error(res.message);
      }
    };

    //复制问题
    const copy = (value) => {
      handleCopy(value);
    };

    return {
      promptName,
      promptContent,
      isPromptShow,
      handleAddPrompt,
      promptCancel,
      promptConfirm,
      copy,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
