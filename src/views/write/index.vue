<template>
  <div class="write" v-if="!isDetailShow">
    <WriteTable
      @changeDetailShow="changeDetailShow"
      @changeDetailData="changeDetailData"
    />
  </div>
  <div class="write" v-else>
    <div class="write-left">
      <WriteConfig
        :meet="meet"
        :detailData="detailData"
        @sseListener="sseListener"
        @stopCreate="stopCreate"
        @changeDetailShow="changeDetailShow"
      />
    </div>
    <div class="write-right">
      <WriteContent
        :meet="meet"
        @stopCreate="stopCreate"
        @sseListener="sseListener"
      />
    </div>
  </div>
</template>

<script>
import { getHistory, stopWrite } from "@/shared/api/write";
import { getUserInfo } from "@/utils/common.js";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { reactive, toRefs } from "vue";
import WriteConfig from "./components/writeConfig";
import WriteContent from "./components/writeContent";
import WriteTable from "./components/writeTable";

export default {
  name: "Write",
  components: {
    WriteConfig,
    WriteContent,
    WriteTable,
  },
  setup() {
    const detailParams = reactive({
      isDetailShow: false, // 列表页是否展示
      detailData: {
        id: undefined,
        writeTitle: undefined,
        writeContent: "",
        selectModel: undefined,
        freedomValue: 1,
        writeNumber: undefined,
        fileList: [],
        template: [],
        templateReferFiles: [],
      },
    });

    // 详情是否展示变更
    const changeDetailShow = (val) => {
      detailParams.isDetailShow = val;
      meet.message = "";
    };

    // 详情变更
    const changeDetailData = (val) => {
      console.log("changeDetailData", val);
      detailParams.detailData = {
        ...detailParams.detailData,
        ...val,
      };
      meet.taskId = val.id; // 更新任务id
      getHistoryList(meet.taskId);
    };

    //----会话相关
    const meet = reactive({
      taskId: "", // 当前写作任务id
      chatIdObj: {}, // 会话id
      loading: false, // 是否在加载
      message: "", // 问答记录
      history: [], // 创作历史
      abortController: null,
      isCreating: false, // 是否正在写作
      isCreatingArr: [],
      lastJson: {}, // 上一次发送的json
    });

    const getHistoryList = async (id) => {
      const history = [];
      const res = await getHistory(id);
      if (res.message === "成功") {
        if (res.data && res.data.length) {
          res.data.map((item) => {
            history.push({
              ...item,
              time: dayjs(item.createDate).format("YYYY-MM-DD HH:mm:ss"),
            });
          });
        }
      } else {
        message.error(res.message);
      }
      meet.history = history;
    };

    // 监听创作内容
    const sseListener = async (json) => {
      if (!json) {
        meet.message = "";
        json = meet.lastJson;
      } else {
        meet.lastJson = json;
      }
      meet.loading = true;
      meet.abortController = new AbortController(); //提供一个能力给我们去提前终止一个 fetch 请求
      let url = "";
      const option = {
        headers: {
          "Content-Type": "application/json",
          authentication: getUserInfo().token,
        },
        signal: meet.abortController.signal,
        //在与事件源的连接打开时触发
        onopen() {
          console.log("onopen");
        },
        //在从事件源接收到数据时触发
        onmessage(msg) {
          console.log("onmessage", msg);
          if (
            msg.event !== "message_end" &&
            msg.data !== "message_end" &&
            msg.event !== "end"
          ) {
            if (msg.event === "answer") {
              meet.loading = false;
              meet.isCreating = true;
              meet.isCreatingArr.push(meet.taskId);
              if (msg.data) {
                const res = JSON.parse(msg.data);
                const title =
                  "<p class='article-title'><span class='article-title-text'>" +
                  json.writingTitle +
                  "</span></p>";
                if (res.taskId === meet.taskId) {
                  meet.message = title + res.result;
                  meet.chatIdObj[meet.taskId] = res.sseKey;
                }
              }
            }
          } else {
            meet.isCreating = false;
            meet.isCreatingArr.splice(
              meet.isCreatingArr.indexOf(meet.taskId),
              1
            );
            meet.loading = false;
          }
        },
        //在事件源连接未能打开时触发
        onerror(err) {
          console.error(err);
        },
        onclose(arg) {
          // message.error("事件源连接已断开！");
          console.log("onclose", arg);
          // 断开时，刷新历史记录
          getHistoryList(meet.taskId);
        },
        openWhenHidden() {}, // 这个方法必须传，否则切换标签页会自动重连
      };
      url = "chat/writing/write";
      Object.assign(option, {
        body: JSON.stringify(json),
        method: "POST",
      });
      fetchEventSource(url, option);
    };

    const stopCreate = () => {
      meet.loading = false;
      meet.isCreating = false;
      meet.isCreatingArr.splice(meet.isCreatingArr.indexOf(meet.taskId), 1);
      meet.abortController.abort();
      meet.abortController = null;
      stopWrite(meet.chatIdObj[meet.taskId]);
    };

    return {
      meet,
      ...toRefs(detailParams),
      stopCreate,
      sseListener,
      changeDetailShow,
      changeDetailData,
    };
  },
};
</script>
<style lang="less">
@import url(./index.less);
</style>
