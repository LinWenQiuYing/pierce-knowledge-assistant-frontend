<template>
  <div class="chat">
    <div class="chat-middle">
      <div class="chat-middle-loading" v-if="meet.isChatMidLoading">
        <a-spin tip="正在加载" />
      </div>
      <div class="chat-middle-container" v-if="!meet.isChatMidLoading">
        <div class="container-content">
          <div
            class="itemSelf"
            v-for="(item, index) in meet.content"
            :key="index"
          >
            <person
              :question="item.content"
              @updatePromptList="updatePromptList"
            ></person>
            <machine
              :index="index"
              :answer="item.message"
              :retrieval_backtrack="item.retrieval_backtrack"
              :meet="meet"
              @changeQuestinInput="changeQuestinInput"
              @changeMeetContent="changeMeetContent"
              @changeContentByIndex="changeContentByIndex"
              @sendMessage="sendMessage"
              @openHtml="openHtml"
              v-if="item.message"
            ></machine>
          </div>
          <div v-if="meet.loading" class="loading">正在查询中请稍后......</div>
        </div>
      </div>
      <div class="chat-middle-search">
        <search-menu
          ref="searchMenuRef"
          :meet="meet"
          :taskId="taskId"
          :conversationId="conversationId"
          @changePromptList="changePromptList"
          @changePrompt="changePrompt"
          @changePromptId="changePromptId"
          @changeIsUpdatePrompt="changeIsUpdatePrompt"
          @changeModelList="changeModelList"
          @changeModel="changeModel"
          @changeIsUpdateModel="changeIsUpdateModel"
          @stopCurrentChat="stopCurrentChat"
        ></search-menu>
        <div class="search-container">
          <div class="top" v-if="copyContent">
            <div class="top-content">{{ copyContent }}</div>
            <div class="top-action">
              <span @click="delCopyContent" class="del">清除</span>
            </div>
          </div>
          <a-textArea
            class="custom-textarea"
            v-model:value.trim="meet.questionInput"
            allow-clear
            @keydown="handleKeydown"
            placeholder="输入内容或者选择一个prompt开始聊天（Ctrl+Enter换行）"
            :disabled="
              meet.isUpdateModel || !isReadyForChat || meet.isUpdatePrompt
            "
          >
          </a-textArea>
          <a-tooltip title="提问">
            <div
              class="container-enter"
              :style="meet.loading ? 'background: #97A3B7' : ''"
              @click="sendMessage"
            >
              <img
                alt="enter"
                class="img"
                src="@/assets/images/img/enter.svg"
              />
            </div>
          </a-tooltip>
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
    <div class="backTop" @click="backTop">
      <i class="backTop-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <path fill="currentColor" d="M512 320 192 704h639.936z"></path>
        </svg>
      </i>
    </div>
    <div
      class="modal-content"
      v-if="meet.content[contextIndex]"
      ref="viewHtmlDialogDom"
    >
      <div class="modal-content-top">
        <div
          class="modal-content-top-item"
          :key="index"
          v-for="(item, index) in meet.content[contextIndex]
            .retrieval_backtrack_detail.retrieval_results[viewHtmlFileNameText]"
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
            meet.content[contextIndex].retrieval_backtrack_detail
              .retrieval_backstrack_results[viewHtmlFileName]
          "
        >
          <div
            v-html="
              meet.content[contextIndex].retrieval_backtrack_detail
                .retrieval_backstrack_results[viewHtmlFileName].text
            "
          ></div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script>
import {
  getConversationDetail,
  getHistoryList,
  stopCall,
} from "@/shared/api/chat";
import { getContextType, getUserInfo } from "@/utils/common.js";
import Machine from "@/views/chat/components/machine";
import Person from "@/views/chat/components/person";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Input, Modal, Spin, Tooltip, message } from "ant-design-vue";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useStore } from "vuex";
import SearchMenu from "../searchMenu";

const { TextArea } = Input;
export default {
  name: "Chat",
  components: {
    Person,
    Machine,
    SearchMenu,
    ATextArea: TextArea,
    ATooltip: Tooltip,
    ASpin: Spin,
    AModal: Modal,
  },
  props: [
    "taskId",
    "conversationId",
    "isReadyForChat", //isReadyForChat是否已经有选中的文件
    "copyContent",
    "fileMd5List",
  ],
  emits: ["changeCopyContent", "changeAbortController", "changeIsReadyForChat"],
  setup(props, { emit }) {
    //----会话相关
    const meet = reactive({
      //taskId: "", //当前任务id
      //conversationId: "", //当前会话的id
      questionInput: "", //所提问题
      loading: false, //是否在加载
      isConnecting: false, //是否在和后端连接
      content: [], //问答记录 person-content machine-message [{},{},{}]
      questionList: [], //历史问答记录 [{},{},{}]
      box: null, //meet.box = document.querySelector('.chat-middle');
      promptList: [], //prompt列表
      choosedPrompt: "", //选中的prompt
      choosedPromptId: "", //选中的promptId,
      choosedKnowledgeBase: "", //选中的知识库
      modelList: [], //大模型列表
      choosedModel: "", //选中的大模型
      isHistoryLoading: false, //左侧历史问答纪录列表是否在加载
      isChatMidLoading: false, //点击左侧某历史会话时，中间问答是否在加载
      isUpdatePrompt: false, //是否在刷新prompt
      isUpdateDocBase: false, //是否在刷新所选知识库
      isUpdateModel: false, //是否正在刷新所选大模型
      abortController: null,
    });

    //点击会话列表某会话，修改会话的content
    const changeMeetContent = (value) => {
      console.log("修改会话的content", value);
      meet.content = value;
    };
    //点击重新生成，根据index，修改content
    const changeContentByIndex = (index) => {
      meet.content.splice(index, 1);
    };
    //点击会话列表某会话，修改isChatMidLoading
    const changeChatMidLoading = (value) => {
      meet.isChatMidLoading = value;
    };
    //修改meet中的promptList
    const changePromptList = (value) => {
      meet.promptList = value;
    };
    //修改meet中的prompt
    const changePrompt = (value) => {
      meet.choosedPrompt = value;
    };
    //修改meet中所选prompt的promptId
    const changePromptId = (value) => {
      meet.choosedPromptId = value;
    };
    //确认选中某一prompt，修改更新状态
    const changeIsUpdatePrompt = (value) => {
      meet.isUpdatePrompt = value;
    };
    //确认选中某一知识库，修改更新状态
    const changeIsUpdateDocBase = (value) => {
      meet.isUpdateDocBase = value;
    };
    //修改大模型列表
    const changeModelList = (value) => {
      meet.modelList = value;
    };
    //确认选中某一大模型，修改更新状态
    const changeIsUpdateModel = (value) => {
      meet.isUpdateModel = value;
    };
    //machine重新生成时，修改meet中的questionInput
    const changeQuestinInput = (value) => {
      console.log("这里是", value);
      meet.questionInput = value;
    };
    //修改meet中的所选知识库和所选大模型
    // const changeDocBase = (value) => {
    //   meet.choosedKnowledgeBase = value;
    // };
    const changeModel = (value) => {
      meet.choosedModel = value;
    };
    //修改meet中的loading和isConnecting
    const changeLoading = (v1, v2) => {
      meet.loading = v1;
      meet.isConnecting = v2;
    };

    //清空从阅读器选择的内容
    const delCopyContent = () => {
      emit("changeCopyContent", null);
    };

    //person组件新建prompt后，需更新searchMenu组件中的Prompt列表
    const searchMenuRef = ref(null);
    const updatePromptList = () => {
      searchMenuRef.value.handlePromptList();
    };

    // 发送问题
    const sendMessage = (event) => {
      if (!props.isReadyForChat) {
        return message.warning("请先进行文件选择！");
      }
      if (meet.questionInput.trim() === "" && !props.copyContent) {
        return message.warning("请输入内容再发送！");
      }
      if (typeof event !== "undefined") {
        if (event.ctrlKey) return;
      }
      const reg = new RegExp(/\n/g);
      const results = Array.from(meet.questionInput.matchAll(reg));
      if (
        meet.questionInput.length - results.length === 0 &&
        !props.copyContent
      ) {
        return;
      } else if (meet.isConnecting) {
        return;
      } else {
        meet.content.push({
          content: props.copyContent
            ? props.copyContent + meet.questionInput.trim()
            : meet.questionInput.trim(),
        });
        currentQuesList.value = [
          ...currentQuesList.value,
          props.copyContent
            ? props.copyContent + meet.questionInput.trim()
            : meet.questionInput.trim(),
        ]; //这里不要采用push的方式，watch监视不到！！！
        // currentQuesList.value.push(
        //   props.copyContent
        //     ? props.copyContent + meet.questionInput.trim()
        //     : meet.questionInput.trim()
        // );
        meet.loading = true;
        nextTick(() => {
          meet.box.scrollTop = meet.box.scrollHeight;
        });
        meet.isConnecting = true;
        let historyItem = dealHistory();
        sseListener(historyItem);
        meet.questionInput = "";
      }
    };

    //SSE -- 事件监听   长连接实现，客户端发起请求，连接一直保持，服务器有数据就返回给客户端，这个返回可以是多次间隔的方式。实现文字一个个弹出的功能
    let scrollHight = 0;
    const sseListener = async (history) => {
      // if (!meet.choosedKnowledgeBase) {
      //   message.warning("请在设置中选择一个知识库！");
      //   return;
      // }
      meet.abortController = new AbortController(); //提供一个能力给我们去提前终止一个 fetch 请求
      let url = "";
      const option = {
        headers: {
          "Content-Type": "application/json",
          authentication: getUserInfo().token,
        },
        signal: meet.abortController.signal,
        //在与事件源的连接打开时触发
        async onopen() {
          // meet.content[meet.content.length - 1].message = "";
          // meet.content[meet.content.length - 1].refer = [];
          // meet.content[meet.content.length - 1].retrieval_backtrack = null;
          // meet.content[meet.content.length - 1].retrieval_backtrack_detail =
          //   null;
        },
        //在从事件源接收到数据时触发
        onmessage(msg) {
          var time = new Date();
          console.log(time.toLocaleTimeString(), msg.data, msg.event);
          if (
            msg.event === "message_end" ||
            msg.data === "message_end" ||
            msg.event === "end"
          ) {
            handleStop();
            getHistory(props.taskId);
          } else {
            if (msg.event === "answer") {
              if (msg.data) {
                meet.loading = false;
                let res = JSON.parse(msg.data);
                meet.content[meet.content.length - 1].message = res.result;
              }
            }
            // if (msg.event === "refer") {
            //   if (msg.data) {
            //     meet.content[meet.content.length - 1].refer = JSON.parse(
            //       msg.data
            //     ).map((item) => ({
            //       type: getContextType(item.object_name),
            //       file: item.file,
            //       url: item.url,
            //     }));
            //   }
            // }
            if (msg.event === "retrieval_backtrack") {
              if (msg.data) {
                meet.content[meet.content.length - 1].retrieval_backtrack =
                  JSON.parse(msg.data);
                handleRetrievalBacktrack(meet.content.length - 1);
              }
            }
            if (msg.event === "retrieval_backtrack_detail") {
              if (msg.data) {
                meet.content[
                  meet.content.length - 1
                ].retrieval_backtrack_detail = JSON.parse(msg.data);
              }
            }
          }
          //计算更新前后chat面板的scrollHeight变化量，如果变化超过20px,说明有新消息，需要滚动到底部，将当前面板的scrollHeight赋值给外部定义的scrollHeight为变量，为下次更新做准备
          nextTick(() => {
            if (Math.abs(scrollHight - meet.box.scrollHeight) > 20) {
              meet.box.scrollTo(0, meet.box.scrollHeight);
            }
            scrollHight = meet.box.scrollHeight;
          });
        },
        //在事件源连接未能打开时触发
        onerror(err) {
          console.error(err);
        },
        onclose(arg) {
          // message.error("事件源连接已断开！");
          console.log("onclose", arg);
        },
        openWhenHidden() {}, // 这个方法必须传，否则切换标签页会自动重连
      };
      url = "chat/tasks/call";
      Object.assign(option, {
        body: JSON.stringify({
          taskId: props.taskId,
          question: props.copyContent
            ? props.copyContent + meet.questionInput.trim()
            : meet.questionInput.trim(),
          prompt: meet.choosedPrompt,
          promptId: meet.choosedPromptId,
          llmId: meet.choosedModel.split("+")[2],
          conversationId: props.conversationId,
          fileMd5s: props.fileMd5List,
          history,
        }),
        method: "POST",
      });
      fetchEventSource(url, option);
    };

    //------添加参考文献的角标
    const handleRetrievalBacktrack = function (index) {
      if (meet.content[index].retrieval_backtrack) {
        meet.content[index].retrieval_backtrack.answer_relative_info.map(
          (item) => {
            const str = item.relative_raw_text_index
              .map((i) => {
                const file = {
                  metadata: JSON.parse(
                    meet.content[index].retrieval_backtrack.retrieval_results[i]
                      .metadata
                  ),
                };
                return `<sup class="${getContextType(
                  file.metadata.file
                )}" onclick="handleRetrievalResults(${index},${i})">${
                  i + 1
                }</sup>`;
              })
              .join("");
            meet.content[index].message = meet.content[index].message.replace(
              item.text,
              item.text + str
            );
          }
        );
      }
    };

    const currentRetrievalBacktrack = ref(null);
    const closeRetrievalBacktrack = function () {
      currentRetrievalBacktrack.value = null;
    };
    const store = useStore();
    //点击参考文献的角标，在仓库中存储相应的参考,右侧drawer显示
    window.handleRetrievalResults = (index, i) => {
      currentRetrievalBacktrack.value = {
        ...meet.content[index].retrieval_backtrack.retrieval_results[i],
        metadata: JSON.parse(
          meet.content[index].retrieval_backtrack.retrieval_results[i].metadata
        ),
      };
      store.dispatch(
        "referStore/updateReferTitle",
        currentRetrievalBacktrack.value.metadata.file ||
          currentRetrievalBacktrack.value.metadata.filename ||
          currentRetrievalBacktrack.value.metadata.object_name
      );
      store.dispatch(
        "referStore/updateReferContent",
        currentRetrievalBacktrack.value.text
      );
    };

    //------点击参考文献内容预览
    const viewHtmlDialog = ref(false); //展示参考文献内容的弹框
    const viewHtmlFileName = ref(""); //参考文献名称
    const viewHtmlFileNameText = ref(""); //正则处理后的参考文献
    const contextIndex = ref(-1); //参考文献角标号
    const openHtml = (filename, index) => {
      viewHtmlFileName.value = filename;
      viewHtmlFileNameText.value = filename.split("/").pop()
        ? filename.split("/").pop()
        : filename;
      console.log(viewHtmlFileName.value, viewHtmlFileNameText.value);
      contextIndex.value = index;
      if (
        meet.content[index].retrieval_backtrack_detail
          .retrieval_backstrack_results[filename]
      ) {
        meet.content[
          index
        ].retrieval_backtrack_detail.retrieval_backstrack_results[
          filename
        ].text = meet.content[
          index
        ].retrieval_backtrack_detail.retrieval_backstrack_results[
          filename
        ].text.replace(/#_bookmark\d+/g, "javascript:void(0);");
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

    // 停止回答
    const handleStop = function () {
      meet.isConnecting = false;
      meet.loading = false;
      if (meet.abortController) {
        meet.abortController.abort();
        meet.abortController = null;
      }
    };

    //停止生成时才调用stopCall
    const stopCurrentChat = async () => {
      handleStop();
      await stopCall(meet.conversationId);
    };

    // 获取历史查询记录
    const getHistory = async (id) => {
      meet.isHistoryLoading = true;
      const res = await getHistoryList(id);
      meet.isHistoryLoading = false;
      if (res.message === "成功") {
        meet.questionList = res.data || [];
      } else {
        message.error(res.message);
      }
    };

    //对当前对话的历史记录进行处理
    const dealHistory = () => {
      let historyItem = [];
      meet.content.map((item) => {
        if (item.message) {
          let { content, message } = item;
          historyItem.push({ content, message });
        }
      });
      return historyItem;
    };

    //滚动条始终在最下方
    const changeScroll = () => {
      nextTick(() => {
        meet.box.scrollTo(0, meet.box.scrollHeight);
      });
    };

    //----底部搜索框，keydown事件
    const handleKeydown = (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        //event.preventDefault();
        handleCtrlEnter(); //ctrl+enter换行
      } else if (event.altKey && event.key === "ArrowUp") {
        //event.preventDefault();
        getUpQues(); //查看上一个问题
      } else if (event.altKey && event.key === "ArrowDown") {
        //event.preventDefault();
        getDownQues(); //查看下一个问题
      } else if (event.key === "Enter") {
        sendMessage();
        event.preventDefault();
      }
    };

    const handleCtrlEnter = () => {
      meet.questionInput += "\n"; // 换行
    };

    //点击Ctrl+向上箭头，上翻到上一个问题
    const currentQuesList = ref([]);
    const currentIndex = ref(undefined);
    const curStatus = ref(1);

    //查看上一个问题
    const getUpQues = () => {
      // console.log("bingo", event.ctrlKey, event.key);
      if (!currentQuesList.value.length) {
        message.warning("该会话不存在上一个问题！");
      } else {
        if (curStatus.value == 1) {
          currentIndex.value = currentQuesList.value.length - 1;
          curStatus.value = 0;
          meet.questionInput = currentQuesList.value[currentIndex.value];
        } else if (currentIndex.value == 0) {
          message.warning("该会话不存在上一个问题！");
        } else {
          currentIndex.value = currentIndex.value - 1;
          meet.questionInput = currentQuesList.value[currentIndex.value];
        }
      }
    };
    //查看下一个问题
    const getDownQues = () => {
      if (!currentQuesList.value.length) {
        message.warning("该会话不存在下一个问题！");
      } else {
        if (currentIndex.value >= currentQuesList.value.length - 1) {
          message.warning("该会话不存在下一个问题！");
        } else {
          currentIndex.value = currentIndex.value + 1;
          meet.questionInput = currentQuesList.value[currentIndex.value];
        }
      }
    };

    watch(
      currentQuesList,
      () => {
        if (currentQuesList.value.length) {
          currentIndex.value = currentQuesList.value.length - 1;
          curStatus.value = 1;
        } else {
          currentIndex.value = undefined;
        }
      },
      { immediate: true }
    );

    //根据会话id，查询历史会话详情
    const getDetail = async (id) => {
      emit("changeIsReadyForChat", false);
      meet.isChatMidLoading = true;
      const res = await getConversationDetail(id);
      meet.isChatMidLoading = false;
      if (res.message === "成功") {
        if (res.data && res.data.dateList && res.data.schema) {
          meet.content = res.data.dateList;
          const arr = res.data.dateList.map((item) => {
            return item.content;
          });
          currentQuesList.value = arr; //获取历史问题，支持输入框向上翻查
          emit("changeIsReadyForChat", true);

          //将该会话所用的prompt、知识库和大模型绑定起来
          const config = res.data.schema;
          const promptContent =
            config.prompt.prompt == null ? "" : config.prompt.prompt;
          const promptId = config.prompt.id;

          const model =
            config.llmConfig.modelName +
            "+" +
            config.llmConfig.url +
            "+" +
            config.llmConfig.id;
          meet.choosedPrompt = promptContent;
          meet.choosedPromptId = promptId;
          meet.choosedModel = model;
        }
      } else {
        //防止将现有页面的问答当作历史记录的返回结果
        meet.content = [];
        message.error(res.message);
      }
      changeScroll();
    };

    watch(
      () => props.conversationId,
      async () => {
        if (props.conversationId) {
          await getDetail(props.conversationId); //查看该会话Id是否存在历史对话记录
        }
      }
    );

    watch(
      () => props.copyContent,
      async () => {
        await changeScroll();
      },
      { immediate: true }
    );

    watch(
      () => meet.abortController,
      () => {
        emit("changeAbortController", meet.abortController);
      },
      { immediate: true }
    );

    onMounted(async () => {
      meet.box = document.querySelector(".chat-middle");
    });

    onBeforeUnmount(() => {
      //在组件销毁销毁之前，关闭对话连接
      if (props.conversationId) {
        stopCall(props.conversationId);
      }
    });

    return {
      //----会话相关
      meet,
      //initConversationId,
      changeMeetContent,
      changeContentByIndex,
      changeChatMidLoading,
      changePromptList,
      changePrompt,
      changePromptId,
      changeModelList,
      changeIsUpdateModel,
      // changeDocBase,
      changeModel,
      changeLoading,
      changeIsUpdatePrompt,
      changeIsUpdateDocBase,
      //changeConversationId,
      changeQuestinInput,
      searchMenuRef,
      updatePromptList,
      sendMessage,
      currentRetrievalBacktrack,
      closeRetrievalBacktrack,
      handleStop,
      stopCurrentChat,
      getHistory,
      dealHistory,
      changeScroll,

      //点击参考文献内容预览
      viewHtmlDialog,
      viewHtmlFileName,
      viewHtmlFileNameText,
      contextIndex,
      openHtml,
      scrollIntoView,
      viewHtmlDialogDom,
      backTop,

      //----底部搜索框，ctrl+enter换行
      handleKeydown,
      delCopyContent,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
