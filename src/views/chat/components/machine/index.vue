<template>
  <div class="answer-item">
    <div>
      <div class="answer-item-right">
        <img alt="robot" class="img" src="@/assets/images/img/robot.svg" />
        <div class="right-container">
          <div
            class="context"
            v-html="answer"
            style="white-space: pre-line"
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
                  handlePreview(
                    JSON.parse(type.metadata).file ||
                      JSON.parse(type.metadata).filename ||
                      JSON.parse(type.metadata).object_name,
                    index
                  )
                "
              >
                {{ $index + 1 }}.{{
                  JSON.parse(type.metadata).file ||
                  JSON.parse(type.metadata).filename ||
                  JSON.parse(type.metadata).object_name
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="right-action" v-if="!meet.abortController">
        <div class="restart" @click="reSender(index)">重新生成</div>
        <a-divider type="vertical" />
        <div class="right-action-img">
          <a-tooltip placement="top" title="复制">
            <copy-outlined @click="copy(answer)" />
          </a-tooltip>
          <!-- <a-divider type="vertical" />
          <a-tooltip placement="top" title="踩">
            <dislike-outlined />
          </a-tooltip>
          <a-divider type="vertical" />
          <a-tooltip placement="top" title="赞">
            <like-outlined />
          </a-tooltip> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleCopy } from "@/utils/common.js";
import { Divider, Tooltip } from "ant-design-vue";

export default {
  name: "Machine",
  components: {
    ATooltip: Tooltip,
    ADivider: Divider,
  },
  props: ["answer", "meet", "index", "refer", "retrieval_backtrack"],
  emits: ["changeQuestinInput", "changeMeetContent", "sendMessage", "openHtml"],
  setup(props, { emit }) {
    //复制
    const copy = (value) => {
      const pattern = /<sup[^>]*>.*?<\/sup>/g;
      const replacedText = value.replace(pattern, "");
      handleCopy(replacedText);
    };

    //重新生成
    const reSender = (index) => {
      const str = props.meet.content[index].content;
      emit("changeQuestinInput", str);
      emit("sendMessage");
    };

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

    //点击某一参考文献，展示相关内容
    const handlePreview = (filename, index) => {
      emit("openHtml", filename, index);
    };

    return {
      copy,
      reSender,
      filenameFilter,
      handlePreview,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
