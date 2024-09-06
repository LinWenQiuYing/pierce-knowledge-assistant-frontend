<!--  -->
<template>
  <div class="search-menu">
    <div class="search-menu-left">
      <div class="menu-item" @click="handleShow">
        <img alt="history" class="img" src="@/assets/images/img/history.svg" />
        <div class="title">聊天历史</div>
      </div>
      <div class="drop">
        <a-dropdown
          placement="topRight"
          overlayClassName="menu-item-drop"
          trigger="click"
          v-if="list.length"
        >
          <div class="menu-item">
            <img
              alt="prompt"
              class="img"
              src="@/assets/images/img/prompt.svg"
            />
            <div class="title">选择prompt</div>
          </div>
          <template #overlay>
            <a-menu class="container" triggerSubMenuAction="click">
              <a-menu-item
                v-for="(item, index) in list"
                :key="index"
                :class="[
                  'user-content-item',
                  item.id === meet.choosedPromptId ? 'choosedPrompt' : '',
                ]"
                @click="confirmPrompt(item)"
              >
                <a-popover
                  :title="item.promptName"
                  placement="right"
                  overlayClassName="prompt-popover"
                >
                  <template #content>
                    {{ item.promptContent }}
                  </template>
                  <check-outlined v-if="item.id === meet.choosedPromptId" />
                  {{ item.promptName }}
                </a-popover>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      <a-popover
        v-model:visible="isSettingShow"
        overlayClassName="setting-popover"
        trigger="click"
      >
        <template #content>
          <div class="setting-item">
            <img
              alt="doc-base"
              class="img"
              src="@/assets/images/img/doc-base.svg"
              style="display: inline"
            />知识库
          </div>
          <a-select
            v-model:value="selectedBase"
            placeholder="请选择知识库"
            :options="docBaseOption"
            dropdownClassName="setting-doc-cascader"
          />
          <div class="setting-item">
            <img
              alt="modle"
              class="img"
              src="@/assets/images/img/modle.svg"
              style="display: inline"
            />大模型
          </div>
          <a-select
            v-model:value="selectedModel"
            placeholder="请选择大模型"
            :options="modelOption"
            dropdownClassName="setting-model-cascader"
          />
          <div class="setting-action">
            <a-button class="cancel-btn" @click="cancelSetting">取消</a-button>
            <a-button class="confirm-btn" @click="confirmSetting"
              >确定</a-button
            >
          </div>
        </template>
        <div class="menu-item" @click="changeSettingShow">
          <img
            alt="setting"
            class="img"
            src="@/assets/images/img/setting.svg"
          />
          <div class="title">设置</div>
        </div>
      </a-popover>
      <!-- <div class="menu-item">
        <img
          alt="export"
          class="img"
          src="@/assets/images/img/export-fill.svg"
        />
        <div class="title">导出</div>
      </div> -->
    </div>
    <div
      class="search-menu-right"
      @click="stopChat"
      v-if="meet.abortController"
    >
      停止生成<icon-svg icon-class="stop-chat" />
    </div>
  </div>
</template>

<script>
import { getModelList, updateConfig } from "@/shared/api/chat";
import { getPromptList } from "@/shared/api/prompt";
import { getFileTree } from "@/shared/api/resource";
import { modalConfirm } from "@/utils/common";
import {
  Button,
  Dropdown,
  Menu,
  Popover,
  Select,
  message,
} from "ant-design-vue";
import { onMounted, ref } from "vue";
const { Item } = Menu;
export default {
  name: "SearchMenu",
  components: {
    ADropdown: Dropdown,
    AMenu: Menu,
    AMenuItem: Item,
    APopover: Popover,
    ASelect: Select,
    AButton: Button,
  },
  props: ["meet", "isChooseShow"],
  emits: [
    "handleLeftShow",
    "changePromptList",
    "changeDocBaseList",
    "changeModelList",
    "changePrompt",
    "changePromptId",
    "changeDocBase",
    "changeModel",
    "isUpdateDocBase",
    "changeIsUpdateDocBase",
    "changeIsUpdateModel",
    "stopCurrentChat",
    "changeIsUpdatePrompt",
    // "changeIsChooseShow",
  ],
  setup(props, { emit }) {
    //----聊天历史
    //左侧历史记录列表是否展示
    const handleShow = () => {
      emit("handleLeftShow");
    };

    //----选择prompt
    //用户自定义列表
    const list = ref([]);
    const handlePromptList = async () => {
      const res = await getPromptList();
      if (res.message === "成功") {
        list.value =
          (res.data &&
            res.data.map((item) => ({
              promptName: item.promptName,
              promptContent: item.prompt,
              id: item.id,
            }))) ||
          [];
        list.value.unshift({
          promptName: "默认",
          promptContent: "",
          id: "-1", //默认的时候 id为"-1"
        });
        emit("changePromptList", list.value);
        emit("changePromptId", list.value[0].id);
        emit("changePrompt", list.value[0].promptContent);
      } else {
        message.error(res.message);
      }
    };

    //确定所选prompt
    const confirmPrompt = (item) => {
      const title = "prompt选取";
      const content = `是否选择 ${item.promptName}?`;
      const onOk = async () => {
        const json = {
          dialogueId: props.meet.conversationId,
          promptId: item.id,
        };
        emit("changeIsUpdatePrompt", true);
        const res = await updateConfig(json);
        if (res.message === "成功") {
          emit("changePrompt", item.promptContent);
          emit("changePromptId", item.id);
          emit("changeIsUpdatePrompt", false);
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    //----设置
    const isSettingShow = ref(false);
    const changeSettingShow = () => {
      //保证每次打开设置，给用户展示的都是最近一次选择的知识库和刷新成功的大模型
      selectedBase.value = props.meet.choosedKnowledgeBase;
      selectedModel.value = props.meet.choosedModel;
    };

    //知识库
    const selectedBase = ref(undefined);
    const docBaseOption = ref([]);

    //获取知识库下拉选项
    const getDocBase = async () => {
      const res = await getFileTree();
      if (res.message === "成功") {
        if (!res.data || !res.data.child || !res.data.child.length) {
          return;
        } else {
          docBaseOption.value = res.data.child.map((item) => {
            return {
              label: item.category.categoryName,
              value: item.category.bucketAlias + "+" + item.category.id,
            };
          });
          // console.log("知识库下拉框选项", docBaseOption.value);
          emit("changeDocBaseList", docBaseOption.value);
          selectedBase.value = docBaseOption.value[0].value;
          emit("changeDocBase", selectedBase.value);
        }
      } else {
        message.error(res.message);
      }
    };

    //大模型
    const selectedModel = ref(undefined);
    const modelOption = ref([]);

    //获取大模型下拉选项
    const getModelOption = async () => {
      const json = {
        pageNo: 1,
        pageSize: 10,
      };
      const res = await getModelList(json);
      if (res.message === "成功") {
        if (res.data && res.data.dateList && res.data.dateList.length) {
          modelOption.value = res.data.dateList.map((item) => {
            return {
              label: item.name,
              value: item.name + "+" + item.modelUrl + "+" + item.modelId,
            };
          });
          // console.log("大模型下拉框选项", modelOption.value);
          emit("changeModelList", modelOption.value);
          selectedModel.value = modelOption.value[0].value;
          emit("changeModel", selectedModel.value);
        }
      } else {
        message.error(res.message);
      }
    };

    const cancelSetting = () => {
      isSettingShow.value = false;
    };

    //刷新大模型
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
        libraryId: selectedBase.value.split("+")[1],
        llmId: selectedModel.value.split("+")[2],
      };
      emit("changeIsUpdateDocBase", true);
      emit("changeIsUpdateModel", true);
      const res = await updateConfig(json);
      if (res.message === "成功") {
        emit("changeDocBase", selectedBase.value);
        emit("changeModel", selectedModel.value);
        emit("changeIsUpdateDocBase", false);
        emit("changeIsUpdateModel", false);
      } else {
        message.error(res.message);
      }
    };

    //点击设置确认按钮  刷修大模型和知识库
    const confirmSetting = async () => {
      if (!selectedBase.value) {
        message.warning("请选择知识库！");
        return;
      }
      if (!selectedModel.value) {
        message.warning("请选择大模型！");
        return;
      }
      isSettingShow.value = false;
      refreshDocModel();
    };

    //停止会话
    const stopChat = () => {
      emit("stopCurrentChat");
    };

    onMounted(async () => {
      handlePromptList();
      await getDocBase();
      await getModelOption();
      // console.log(
      //   "prompt列表",
      //   props.meet.promptList,
      //   "知识库列表",
      //   props.meet.docBaseList,
      //   "大模型列表",
      //   props.meet.modelList
      // );
      // console.log(
      //   "promptContent",
      //   props.meet.choosedPrompt,
      //   "promptId",
      //   props.meet.choosedPromptId,
      //   "知识库",
      //   props.meet.choosedKnowledgeBase,
      //   "大模型",
      //   props.meet.choosedModel
      // );
    });

    return {
      //聊天
      handleShow,
      //prompt
      list,
      handlePromptList,
      // currentPromptName,
      // curruntPromptContent,
      // isDropContentShow,
      // handleDropContentShow,
      // handleDropContentDisappear,
      confirmPrompt,
      //设置
      isSettingShow,
      changeSettingShow,
      selectedBase,
      docBaseOption,
      getDocBase,
      selectedModel,
      modelOption,
      getModelOption,
      cancelSetting,
      //selectOption,
      refreshDocModel,
      confirmSetting,
      stopChat,

      //isShow,
      //startChat,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
