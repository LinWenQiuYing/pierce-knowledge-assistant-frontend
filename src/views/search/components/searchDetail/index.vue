<template>
  <div class="detail">
    <div :class="['detail-left', !detail.isDetail ? 'detail-left-active' : '']">
      <div
        :class="[
          'detail-left-search',
          !detail.isDetail ? 'detail-left-search-active' : '',
        ]"
      >
        <a-input
          id="myInput"
          v-model:value.trim="question"
          placeholder="请输入搜索关键词"
          :maxlength="60"
          allow-clear
          @keyup.enter="startSearch"
          class="search-input"
        >
          <template #suffix>
            <a-button type="primary" shape="round" @click="startSearch">
              <template #icon><icon-svg icon-class="icon-search" /></template>
              搜 索
            </a-button>
          </template>
        </a-input>
      </div>
      <div class="detail-left-choice">
        <div
          :class="[
            'choice-item',
            search.selectedWay === 'AI搜索' ? 'active' : '',
          ]"
          @click="handleChangeWay('AI搜索')"
        >
          <robot-outlined />AI搜索
        </div>
        <div
          :class="[
            'choice-item',
            search.selectedWay === '关键词搜索' ? 'active' : '',
          ]"
          @click="handleChangeWay('关键词搜索')"
        >
          <file-text-outlined />关键词搜索
        </div>
      </div>
      <div
        :class="[
          'detail-left-des',
          !detail.isDetail ? 'detail-left-des-active' : '',
        ]"
      >
        <div class="des-left" v-if="detail.isDetail">
          为您找到了相关结果约<span class="des-left-num">{{ answerNum }}</span
          >个
        </div>
        <div class="des-left" v-if="!detail.isDetail"></div>
      </div>
      <div class="detail-left-content" v-if="detail.isDetail">
        <div
          class="content-item"
          v-for="(item, index) in searchAnswer"
          :key="index"
        >
          <div class="content-item-title" v-html="item.title"></div>
          <a-tooltip
            placement="top"
            :title="item.content.replace(/(<\/?span.*?>)/gi, '')"
            overlayClassName="answer-tooltip"
          >
            <div class="content-item-body" v-html="item.content"></div>
          </a-tooltip>
        </div>

        <a-pagination
          v-model:current="current"
          v-model:page-size="pageSize"
          :total="total"
          class="content-item-list-pagination"
          @change="onChange(current, pageSize)"
        />
      </div>
      <div
        class="detail-none"
        v-if="!detail.isLoading && !detail.isDetail && !search.isFirstShow"
      >
        <icon-svg icon-class="search-none" />
        <div class="detail-none-des">未查询到相关知识内容</div>
        <div class="detail-none-advice">
          建议您修改搜索<span class="advice-highlight">关键词</span>或<span
            class="advice-highlight"
            >搜索方式</span
          >再试一次
        </div>
      </div>
      <div
        class="detail-none"
        v-if="!detail.isDetail && search.isFirstShow && !detail.isLoading"
      ></div>
      <a-spin
        class="detail-load"
        v-if="detail.isLoading"
        tip="正在加载"
        size="large"
      />
    </div>
    <detail-right
      v-if="detail.isDetail"
      :detail="detail"
      :chat="chat"
      :retrieval_backtrack="chat.content.retrieval_backtrack"
      @sendMessage="sendMessage"
      @changeRetrieval="changeRetrieval"
    ></detail-right>
  </div>
</template>

<script>
import { stopCall } from "@/shared/api/chat";
import {
  getChatId,
  searchWithAI,
  searchWithKeyword,
} from "@/shared/api/search";
import { getContextType, getUserInfo } from "@/utils/common.js";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  Button,
  Input,
  Pagination,
  Spin,
  Tooltip,
  message,
} from "ant-design-vue";
import { onBeforeUnmount, onMounted, reactive, ref, toRefs } from "vue";
import DetailRight from "../detailRight";

export default {
  name: "SearchDetail",
  components: {
    AInput: Input,
    AButton: Button,
    APagination: Pagination,
    ASpin: Spin,
    DetailRight,
    ATooltip: Tooltip,
  },

  setup() {
    //搜索结果相关
    const detail = reactive({
      isLoading: false, //该问题是否正在加载
      isDetail: false, //该问题是否查询到结果  左侧列表结果
      isRightLoading: true, //右侧AI对话内容加载
    });

    //搜索设置相关
    const search = reactive({
      searchWay: ["AI搜索", "关键词搜索"], //搜索方式列表
      selectedWay: "AI搜索", //选中搜索方式
      isFirstShow: true, //一开始默认结果展示区域为空白,用于差异化搜索不到内容时，返回的"未查到相关知识内容"提示语
    });

    //------搜索输入框
    const question = ref("");

    //修改当前搜索方式
    const handleChangeWay = (value) => {
      search.selectedWay = value;
    };

    //分页
    const pagination = reactive({
      total: 0,
      current: 1,
      pageSize: 6,
      //pageSizeOptions: ["10", "20", "15", "20"],
      onChange: (current, pageSize) => {
        isPaginationSearch.value = true;
        pagination.current = current;
        pagination.pageSize = pageSize;
        getList();
      },
    });
    //添加一个参数，判别是点击搜索按钮搜索（保证pageNum = 1）or点击分页进行的搜索
    const isPaginationSearch = ref(false);

    //点击搜索按钮
    const startSearch = () => {
      //切断上一次的对话
      if (chatId.value) {
        stopCurrentChat();
      }
      isPaginationSearch.value = false;
      //detail.isDetail = false;
      getList(); //搜索
      sendMessage();
    };

    //左侧列表的搜索结果
    const searchAnswer = ref([]);
    const answerNum = ref(undefined); //左侧列表搜索结果的数目

    //搜索时随机生成的chat_id
    const chatId = ref(undefined);
    //搜索列表获取
    const getList = async () => {
      //detail.isDetail = false;  差异化点击分页搜索和点击搜索按钮
      //先判断输入框有没有内容
      const pattern = /\S/;
      if (pattern.test(question.value)) {
        if (!isPaginationSearch.value) {
          detail.isDetail = false;
        }
        detail.isLoading = true;
        const res = await getChatId();
        if (res.message === "成功") {
          chatId.value = res.data || "";
        } else {
          message.warning("获取对话ID失败，请重试！");
          return;
        }
        const json = {
          question: question.value,
          libraryName: "search", //知识库字段，这边先写死
          pageNo: isPaginationSearch.value ? pagination.current : 1,
          pageValues: [],
        };
        const result =
          search.selectedWay === "AI搜索"
            ? await searchWithAI(json)
            : await searchWithKeyword(json); //根据搜索方式选择不同接口
        detail.isLoading = false;

        if (
          result.message === "成功" &&
          result.data.dateList &&
          result.data.dateList.length
        ) {
          if (!isPaginationSearch.value) {
            pagination.current = 1;
          }
          detail.isDetail = true;
          searchAnswer.value = result.data.dateList.map((item) => {
            return {
              title: item.docName,
              content: item.content,
            };
          });
          pagination.total = result.data.totalNum;
          answerNum.value = result.data.totalNum;
        } else {
          search.isFirstShow = false; //展示未查询到相关内容的图标
          detail.isDetail = false;
          return message.warning("未查询到相关知识内容，请重试！");
        }
      } else {
        return message.warning("请输入搜索内容！");
      }
    };

    //右侧-----AI搜索相关
    const chat = reactive({
      abortController: null,
      content: [],
    });

    // 右侧AI对话----发送问题
    const sendMessage = async (event) => {
      detail.isRightLoading = true;
      if (typeof event !== "undefined") {
        if (event.ctrlKey) return;
      }
      const res = await getChatId();
      if (res.message === "成功") {
        chatId.value = res.data || "";
        chat.content.push({
          content: question.value,
        });
        sseListener();
      } else {
        message.error(res.message);
      }
    };

    //右侧---长连接
    const sseListener = async () => {
      chat.abortController = new AbortController(); //提供一个能力给我们去提前终止一个 fetch 请求
      let url = "";
      const option = {
        headers: {
          "Content-Type": "application/json",
          authentication: getUserInfo().token,
        },
        signal: chat.abortController.signal,
        //在与事件源的连接打开时触发
        async onopen() {
          chat.content.message = "";
          chat.content.refer = [];
          chat.content.retrieval_backtrack = null;
          chat.content.retrieval_backtrack_detail = null;
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
          } else {
            if (msg.event === "answer") {
              if (msg.data) {
                detail.isRightLoading = false;
                let res = JSON.parse(msg.data);
                chat.content.message = res.result;
              }
            }

            // if (msg.event === "refer") {
            //   if (msg.data) {
            //     chat.content.refer = JSON.parse(msg.data).map((item) => ({
            //       type: getContextType(item.object_name),
            //       file: item.file,
            //       url: item.url,
            //     }));
            //   }
            // }

            if (msg.event === "retrieval_backtrack") {
              if (msg.data) {
                chat.content.retrieval_backtrack = JSON.parse(msg.data);
                handleRetrievalBacktrack(); //添加参考文献的角标
              }
            }

            if (msg.event === "retrieval_backtrack_detail") {
              if (msg.data) {
                chat.content.retrieval_backtrack_detail = JSON.parse(msg.data);
              }
            }
          }
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
          question: question.value, //问题
          conversationId: chatId.value,
        }),
        method: "POST",
      });
      fetchEventSource(url, option);
    };

    //------添加参考文献的角标
    const handleRetrievalBacktrack = function () {
      if (chat.content.retrieval_backtrack) {
        chat.content.retrieval_backtrack.answer_relative_info.map((item) => {
          const str = item.relative_raw_text_index
            .map((i) => {
              const file = {
                metadata: JSON.parse(
                  chat.content.retrieval_backtrack.retrieval_results[i].metadata
                ),
              };
              return `<sup class="${getContextType(file.metadata.file)}" >${
                i + 1
              }</sup>`;
            })
            .join("");
          chat.content.message = chat.content.message.replace(
            item.text,
            item.text + str
          );
        });
      }
    };

    //右侧栏点击某一参考文献，修改chat.content.retrieval_backtrack_detail.retrieval_backstrack_results内容
    const changeRetrieval = (filename) => {
      chat.content.retrieval_backtrack_detail.retrieval_backstrack_results[
        filename
      ].text =
        chat.content.retrieval_backtrack_detail.retrieval_backstrack_results[
          filename
        ].text.replace(/#_bookmark\d+/g, "javascript:void(0);");
    };

    // 停止回答
    const handleStop = () => {
      if (chat.abortController) {
        chat.abortController.abort();
        chat.abortController = null;
      }
    };

    //停止生成时才调用stopCall
    const stopCurrentChat = async () => {
      handleStop();
      await stopCall(chatId.value);
    };

    onMounted(async () => {
      document.getElementById("myInput").focus(); //类似百度，实现从一个页面搜索框跳到另一个页面，光标自动移到该页面inpu框中
    });

    onBeforeUnmount(() => {
      //在组件销毁销毁之前，关闭对话连接
      if (chatId.value) {
        stopCall(chatId.value);
      }
    });

    return {
      detail,
      search,
      question,
      startSearch,
      answerNum,
      ...toRefs(pagination),
      searchAnswer,
      handleChangeWay,
      getList,

      chat,
      sendMessage,
      changeRetrieval,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
