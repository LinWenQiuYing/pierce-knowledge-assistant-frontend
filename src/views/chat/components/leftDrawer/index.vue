<template>
  <div class="left-drawer">
    <div class="left-drawer-title">
      <a-button
        type="primary"
        class="left-drawer-title-btn"
        @click="addNewChat"
      >
        <icon-svg icon-class="icon-add" />
        <span class="btn-title">新的聊天</span>
      </a-button>
    </div>
    <div class="left-drawer-middle" v-show="flag">
      <div class="left">
        <exclamation-circle-outlined />
        <span class="content">对话保留30天，过期自动删除！</span>
      </div>
      <div class="right" @click="handleClose">
        <img alt="delete" class="img" src="@/assets/images/img/close.svg" />
      </div>
    </div>
    <div class="left-drawer-bottom">
      <a-spin v-if="isHistoryLoading" tip="正在加载" />
      <div
        v-else
        :class="[
          'left-drawer-bottom-item',
          currentHistory.includes(item.id)
            ? 'left-drawer-bottom-item-active'
            : '',
        ]"
        v-for="(item, index) in questionList"
        :key="index"
        @click="getDetail(item.id)"
      >
        <div class="item-content">
          <div class="left">
            <img
              alt="message"
              class="message-img"
              src="@/assets/images/img/message.svg"
            />
            <div class="title">{{ item.title }}</div>
          </div>

          <div class="right">
            <a-tooltip title="重命名">
              <img
                alt="message"
                class="img"
                src="@/assets/images/img/rename.svg"
                @click.stop="renameHistory(item)"
              />
            </a-tooltip>
            <a-tooltip title="删除">
              <img
                alt="message"
                class="img"
                src="@/assets/images/img/delete.svg"
                @click.stop="deleteHistory(item.id)"
              />
            </a-tooltip>
          </div>
        </div>
        <div class="item-des">
          <span class="time">{{ item.dialogueTime }}</span>
          <!-- <span class="num">10条对话</span> -->
        </div>
      </div>
    </div>
  </div>

  <a-modal
    v-model:visible="isModalShow"
    title="历史记录重命名"
    @ok="handleConfirm"
    @cancel="handleCancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="600px"
    class="rename-modal"
    :maskClosable="false"
  >
    <div class="rename-modal-content">
      <div class="item">
        <div class="name">名称：</div>
        <a-input
          v-model:value.trim="newName"
          placeholder="请输入名称"
          :maxlength="60"
          @pressEnter="handleConfirm"
        />
      </div>
    </div>
  </a-modal>
</template>

<script>
import {
  delHistoryConversation,
  getConversationDetail,
  getConversationId,
  updateConfig,
  updateHistoryName,
} from "@/shared/api/chat";
import { modalConfirmCancel } from "@/utils/common";
import { Button, Input, Modal, Spin, Tooltip, message } from "ant-design-vue";
import { ref, toRefs } from "vue";

export default {
  name: "LeftDrawer",
  components: {
    AButton: Button,
    ATooltip: Tooltip,
    ASpin: Spin,
    AModal: Modal,
    AInput: Input,
  },
  props: ["meet"],
  emits: [
    "getHistory",
    "changeMeetContent",
    "changeScroll",
    "changeChatMidLoading",
    "changeConversationId",
    "changeLoading",
    "changeCurrentQuesList",
    "changeQuestinInput",
    "handleRightShow",
    "changePrompt",
    "changePromptId",
    "changeDocBase",
    "changeModel",
    "changeIsUpdateModel",
    "changeIsUpdateDocBase",
  ],
  setup(props, { emit }) {
    //----对话保留提示
    const flag = ref(true);
    const handleClose = () => {
      flag.value = false;
    };

    //----添加新的会话
    const addNewChat = async () => {
      if (props.meet.isConnecting) {
        return message.warning("正在对话中，请稍后再试！");
      } else {
        const res = await getConversationId();
        if (res.message === "成功") {
          if (res.data) {
            currentHistory.value = res.data;
            emit("changeConversationId", res.data);
            emit("changeCurrentQuesList", []);
            //新建会话需要将prompt、知识库、大模型均置为默认,这里均设置为列表第一项
            emit("changePrompt", props.meet.promptList[0].promptContent);
            emit("changePromptId", props.meet.promptList[0].id);
            emit("changeDocBase", props.meet.docBaseList[0].value);
            emit("changeModel", props.meet.modelList[0].value);
            //新建会话之后需要刷新大模型和知识库
            await refreshDocModel();
            emit("changeMeetContent", []);
          }
        } else {
          return message.error(res.message);
        }
      }
    };

    //----历史会话相关
    //删除一条会话历史记录
    const isEdit = ref(false);
    const deleteHistory = async (id) => {
      if (props.meet.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      isEdit.value = true;
      const title = "删除提示！";
      const content = "是否确认删除该条历史记录？";
      const onOk = async () => {
        const res = await delHistoryConversation(id);
        isEdit.value = false;
        if (res.message === "成功") {
          if (id === props.meet.conversationId) {
            addNewChat(); //如果删除的是当前会话，则删除成功后，要开启新的会话
          }
          emit("getHistory", props.meet.taskId);
        } else {
          message.error(res.message);
        }
      };
      const onCancel = async () => {
        isEdit.value = false;
      };
      modalConfirmCancel(title, content, onOk, onCancel);
    };

    //重命名一条历史记录
    const newName = ref("");
    const isModalShow = ref(false);
    const reNameHistoryId = ref("");

    const renameHistory = (item) => {
      reNameHistoryId.value = item.id;
      isModalShow.value = true;
      newName.value = item.title;
    };

    const handleConfirm = async () => {
      if (props.meet.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      if (newName.value.trim() === "") {
        return message.warning("名称不能为空！", 1);
      }
      const json = {
        uuid: reNameHistoryId.value,
        dialogueName: newName.value.trim(),
      };
      const res = await updateHistoryName(json);
      if (res.message === "成功") {
        emit("getHistory", props.meet.taskId);
        isModalShow.value = false;
      } else {
        message.error(res.message);
      }
    };

    const handleCancel = () => {
      isModalShow.value = false;
      newName.value = "";
    };

    const currentHistory = ref([]); //左侧列表：当前选中的历史记录的会话id
    //点击历史记录，查询历史会话详情
    const getDetail = async (id) => {
      currentHistory.value = [id];
      emit("handleRightShow", false);
      if (props.meet.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      if (isEdit.value) return;
      //对话时，meet.isLoading位置修改，聊天模块点击某一历史记录，将该值初始化为false；阅读时确认选择某一文件时同理
      emit("changeLoading", false, false);
      //修改当前会话的conversationId
      emit("changeConversationId", id);
      emit("changeChatMidLoading", true);
      const res = await getConversationDetail(id);
      emit("changeChatMidLoading", false);
      if (res.message === "成功") {
        // emit("changeChatMidLoading", false);
        if (res.data && res.data.dateList && res.data.schema) {
          const arr = res.data.dateList.map((item) => {
            return item.content;
          });
          emit("changeQuestinInput", "");
          emit("changeCurrentQuesList", arr); //点击左侧会话，获取历史问题，支持输入框向上翻查
          emit("changeMeetContent", res.data.dateList);
          //将该会话所用的prompt、知识库和大模型绑定起来
          const config = res.data.schema;
          const promptContent =
            config.prompt.prompt == null ? "" : config.prompt.prompt;
          const promptId = config.prompt.id;
          const docBase = config.library.bucketAlias + "+" + config.library.id;
          const model =
            config.llmConfig.modelName +
            "+" +
            config.llmConfig.url +
            "+" +
            config.llmConfig.id;
          emit("changePrompt", promptContent);
          emit("changePromptId", promptId);
          emit("changeDocBase", docBase);
          emit("changeModel", model);
        }
      } else {
        //防止将现有页面的问答当作历史记录的返回结果
        emit("changeMeetContent", []);
        message.error(res.message);
      }
      emit("changeScroll");
    };

    //单独刷新大模型
    // const refreshModel = async () => {
    //   const json = {
    //     taskId: props.meet.taskId,
    //     name: props.meet.choosedModel.split("+")[0],
    //     llmUrl: props.meet.choosedModel.split("+")[1],
    //   };
    //   emit("changeIsUpdateModel", true);
    //   const res = await updateModel(json);
    //   if (res.message === "成功") {
    //     emit("changeIsUpdateModel", false);
    //   } else {
    //     message.error(res.message, 1);
    //   }
    // };

    //刷新知识库和大模型
    const refreshDocModel = async () => {
      const json = {
        dialogueId: props.meet.conversationId,
        promptId: props.meet.choosedPromptId,
        libraryId: props.meet.choosedKnowledgeBase.split("+")[1],
        llmId: props.meet.choosedModel.split("+")[2],
      };
      emit("changeIsUpdateDocBase", true);
      emit("changeIsUpdateModel", true);
      const res = await updateConfig(json);
      if (res.message === "成功") {
        emit("changeIsUpdateDocBase", false);
        emit("changeIsUpdateModel", false);
      } else {
        message.error(res.message, 1);
      }
    };

    return {
      flag,
      handleClose,
      addNewChat,
      isEdit,
      isModalShow,
      reNameHistoryId,
      deleteHistory,
      newName,
      renameHistory,
      handleConfirm,
      handleCancel,
      currentHistory,
      getDetail,
      ...toRefs(props.meet),
      refreshDocModel,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
