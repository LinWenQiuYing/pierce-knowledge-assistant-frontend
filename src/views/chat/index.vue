<template>
  <div class="chat">
    <div class="chat-left" v-show="isLeftDrawerShow">
      <left-drawer
        :meet="meet"
        ref="leftMenuCp"
        @getHistory="getHistory"
        @changeMeetContent="changeMeetContent"
        @changeChatMidLoading="changeChatMidLoading"
        @changeConversationId="changeConversationId"
        @changeScroll="changeScroll"
        @changeLoading="changeLoading"
        @changeCurrentQuesList="changeCurrentQuesList"
        @changeQuestinInput="changeQuestinInput"
        @handleRightShow="handleRightShow"
        @changePrompt="changePrompt"
        @changePromptId="changePromptId"
        @changeDocBase="changeDocBase"
        @changeModel="changeModel"
        @changeIsUpdateModel="changeIsUpdateModel"
        @changeIsUpdateDocBase="changeIsUpdateDocBase"
      ></left-drawer>
    </div>
    <div class="chat-middle">
      <div class="chat-middle-loading" v-if="meet.isChatMidLoading">
        <a-spin tip="正在加载" />
      </div>
      <div class="chat-middle-container" v-if="!meet.isChatMidLoading">
        <!-- <div class="container-top">
          <img alt="person" class="img" src="@/assets/images/img/person.svg" />
          <div class="title">商业银行对公业务场景</div>
        </div> -->
        <div class="container-content">
          <div
            class="itemSelf"
            v-for="(item, index) in meet.content"
            :key="index"
          >
            <!-- <div class="time">2023-08-24 17:23:28</div> -->
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
          @handleLeftShow="handleLeftShow"
          @changePromptList="changePromptList"
          @changeDocBaseList="changeDocBaseList"
          @changeModelList="changeModelList"
          @changePrompt="changePrompt"
          @changePromptId="changePromptId"
          @changeDocBase="changeDocBase"
          @changeModel="changeModel"
          @stopCurrentChat="stopCurrentChat"
          @changeIsUpdateModel="changeIsUpdateModel"
          @changeIsUpdatePrompt="changeIsUpdatePrompt"
          @changeIsUpdateDocBase="changeIsUpdateDocBase"
        ></search-menu>
        <div class="search-container">
          <a-textArea
            class="custom-textarea"
            v-model:value.trim="meet.questionInput"
            allow-clear
            @keydown="handleKeydown"
            placeholder="输入内容或者选择一个prompt开始聊天（Ctrl+Enter换行）"
            :disabled="
              meet.isUpdateModel ||
              !meet.choosedKnowledgeBase ||
              meet.isChatMidLoading ||
              meet.isHistoryLoading ||
              meet.isUpdatePrompt ||
              meet.isUpdateDocBase
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
    <div class="chat-right" v-show="isRightDrawerShow">
      <right-drawer @handleRightShow="handleRightShow"></right-drawer>
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
  getConversationId,
  getHistoryList,
  getTaskList,
  stopCall,
} from "@/shared/api/chat";
import { getContextType, getUserInfo } from "@/utils/common.js";
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
import LeftDrawer from "./components/leftDrawer";
import Machine from "./components/machine";
import Person from "./components/person";
import RightDrawer from "./components/rightDrawer";
import SearchMenu from "./components/searchMenu";

const { TextArea } = Input;
export default {
  name: "Chat",
  components: {
    LeftDrawer,
    RightDrawer,
    Person,
    Machine,
    SearchMenu,
    ATextArea: TextArea,
    ATooltip: Tooltip,
    ASpin: Spin,
    AModal: Modal,
  },
  setup() {
    //----会话相关
    const meet = reactive({
      taskId: "", //当前任务id
      conversationId: "", //当前会话的id
      questionInput: "", //所提问题
      loading: false, //是否在加载
      isConnecting: false, //是否在和后端连接
      content: [], //问答记录 person-content machine-message [{},{},{}]
      questionList: [], //历史问答记录 [{},{},{}]
      box: null, //meet.box = document.querySelector('.chat-middle');
      promptList: [], //prompt列表
      choosedPrompt: "", //选中的prompt
      choosedPromptId: "", //选中的promptId
      docBaseList: [], //知识库列表
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

    //初始获取conversationId
    const initConversationId = async () => {
      const res = await getConversationId();
      if (res.message === "成功") {
        meet.conversationId = res.data || "";
        //输入框上翻内容列表获取
        const result = await getConversationDetail(meet.conversationId);
        if (result.message === "成功") {
          const arr =
            (result.data &&
              result.data.dateList &&
              result.data.dateList.map((item) => item.content)) ||
            [];
          currentQuesList.value = arr;
        }
      } else {
        message.error(res.message);
      }
    };

    //点击会话列表某会话，修改会话的content
    const changeMeetContent = (value) => {
      console.log("修改会话的content", value);
      meet.content = value;
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
    //修改知识库列表
    const changeDocBaseList = (value) => {
      meet.docBaseList = value;
    };
    //确认选中某一知识库，修改更新状态
    const changeIsUpdateDocBase = (value) => {
      meet.isUpdateDocBase = value;
    };
    //修改meet中的所选知识库和所选大模型
    const changeDocBase = (value) => {
      meet.choosedKnowledgeBase = value;
    };

    //修改大模型列表
    const changeModelList = (value) => {
      meet.modelList = value;
    };
    //确认选中某一大模型，修改更新状态
    const changeIsUpdateModel = (value) => {
      meet.isUpdateModel = value;
    };
    //修改meet中的所选大模型
    const changeModel = (value) => {
      meet.choosedModel = value;
    };
    //修改meet中当前会话的conversationId
    const changeConversationId = (value) => {
      meet.conversationId = value;
      console.log("biubiubibibbibbi", meet.conversationId);
    };
    //machine重新生成时，修改meet中的questionInput
    const changeQuestinInput = (value) => {
      console.log("这里是", value);
      meet.questionInput = value;
    };

    //修改meet中的loading和isConnecting
    const changeLoading = (v1, v2) => {
      meet.loading = v1;
      meet.isConnecting = v2;
    };

    //person组件新建prompt后，需更新searchMenu组件中的Prompt列表
    const searchMenuRef = ref(null);
    const updatePromptList = () => {
      searchMenuRef.value.handlePromptList();
    };

    // 发送问题
    const sendMessage = (event) => {
      if (!meet.choosedKnowledgeBase) {
        return message.warning("请在设置中选择一个知识库！");
      }
      if (meet.questionInput.trim() === "") {
        return message.warning("请输入内容再发送！");
      }
      if (typeof event !== "undefined") {
        if (event.ctrlKey) return;
      }
      const reg = new RegExp(/\n/g);
      const results = Array.from(meet.questionInput.matchAll(reg));
      if (meet.questionInput.length - results.length === 0) {
        return;
      } else if (meet.isConnecting) {
        return;
      } else {
        meet.content.push({
          content: meet.questionInput.trim(),
        });
        currentQuesList.value = [
          ...currentQuesList.value,
          meet.questionInput.trim(),
        ]; //这里不要采用push的方式，watch监视不到！！！
        // currentQuesList.value.push(meet.questionInput.trim());
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
      if (!meet.choosedKnowledgeBase) {
        message.warning("请在设置中选择一个知识库！");
        return;
      }
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
          console.log("bingo", meet.content);
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
            getHistory(meet.taskId);
            //leftMenuCp.value.getDetail(meet.conversationId);
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
          taskId: meet.taskId,
          question: meet.questionInput.trim(),
          prompt: meet.choosedPrompt,
          promptId: meet.choosedPromptId,
          conversationId: meet.conversationId,
          libraryId: meet.choosedKnowledgeBase.split("+")[1],
          llmId: meet.choosedModel.split("+")[2],
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
      store.dispatch(
        "referStore/updateReferTime",
        currentRetrievalBacktrack.value.metadata.dataTime
      );
      store.dispatch(
        "referStore/updateReferAuthor",
        currentRetrievalBacktrack.value.metadata.author
      );
      isRightDrawerShow.value = true;
    };

    //------点击参考文献内容预览
    const viewHtmlDialog = ref(false); //展示参考文献内容的弹框
    const viewHtmlFileName = ref(""); //参考文献名称
    const viewHtmlFileNameText = ref(""); //正则处理后的参考文献
    const contextIndex = ref(-1); //这里判断是第几个对话的参考文献
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
      if (res.message === "成功") {
        meet.isHistoryLoading = false;
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

    //----左侧聊天历史显隐
    const isLeftDrawerShow = ref(true);
    const handleLeftShow = () => {
      isLeftDrawerShow.value = !isLeftDrawerShow.value;
    };

    //----右侧文献信息显隐藏
    const isRightDrawerShow = ref(false);
    const handleRightShow = (value) => {
      isRightDrawerShow.value = value;
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
        event.preventDefault();
        sendMessage();
      }
    };

    const handleCtrlEnter = () => {
      meet.questionInput += "\n"; // 换行
    };

    //点击Ctrl+向上箭头，上翻到上一个问题
    const currentQuesList = ref([]);
    const currentIndex = ref(undefined);
    const curStatus = ref(1);
    const changeCurrentQuesList = (arr) => {
      currentQuesList.value = arr;
    };
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

    const leftMenuCp = ref(null);

    onMounted(async () => {
      meet.box = document.querySelector(".chat-middle");
      initConversationId();
      const json = {
        pageNo: 1,
        pageSize: 15,
      };
      const res = await getTaskList(json);
      if (res.message === "成功") {
        if (res.data && res.data.dateList && res.data.dateList.length) {
          meet.taskId = res.data.dateList[0].id || "";
          await getHistory(meet.taskId);
          if (meet.questionList.length) {
            leftMenuCp.value.getDetail(meet.questionList[0].id);
          }
        }
      } else {
        message.error(res.message);
      }
    });

    onBeforeUnmount(() => {
      //在组件销毁销毁之前，关闭对话连接
      if (meet.conversationId) {
        stopCall(meet.conversationId);
      }
    });
    return {
      //----会话相关
      meet,
      initConversationId,
      changeMeetContent,
      changeChatMidLoading,
      changePromptList,
      changePrompt,
      changePromptId,
      changeIsUpdatePrompt,
      changeDocBaseList,
      changeIsUpdateDocBase,
      changeModelList,
      changeIsUpdateModel,
      changeConversationId,
      changeQuestinInput,
      changeDocBase,
      changeModel,
      changeLoading,
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

      //----左侧聊天历史显隐
      isLeftDrawerShow,
      handleLeftShow,
      //----右侧参考文献显隐
      isRightDrawerShow,
      handleRightShow,

      //----底部搜索框，ctrl+enter换行
      handleKeydown,
      handleCtrlEnter,
      getUpQues,
      getDownQues,
      changeCurrentQuesList,

      leftMenuCp,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
