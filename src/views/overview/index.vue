<!--  -->
<template>
  <div class="background-wrapper">
    <div class="overview">
      <div class="overview-top">
        <div class="top-title">
          <div class="title-ch">星环AI知识助理</div>
          <div class="title-en">
            <span class="title-en-first">T </span>r a n s w a r p
            <span class="title-en-first">A </span>I
            <span class="title-en-first">K </span>n o w l e d g e
            <span class="title-en-first">A </span>s s i s t a n t
          </div>
        </div>
        <div class="top-content">{{ titleDes }}</div>
        <div class="top-btn" @click="startChat">开始聊天</div>
      </div>
      <div class="overview-bottom">
        <div
          :class="['overview-bottom-item', `item-${item.key}`]"
          :key="index"
          v-for="(item, index) in detail"
          @click="changeRoute(item.key)"
        >
          <div class="item-title">{{ item.title }}</div>
          <div class="item-explain">{{ item.explain }}</div>
          <div class="item-des">{{ item.des }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "Overview",
  setup() {
    const description = reactive({
      titleDes:
        "星环AI知识助理（TAKA）针对政务、工业、能源等领域定制化应用场景，结合大语言模型技术，提供一站式、全流程解决方案。帮助客户高效地创建业务场景并进行系统定制开发，提供聊天、阅读、写作、搜索、资源库管理等服务。",
      detail: [
        {
          title: "聊 天",
          key: "chat",
          explain: "配置大模型和知识库",
          des: "综合使用大模型和知识库，根据向量库快速检索并匹配文本数据，确保AI生成内容有迹可循，为用户提供更全面、可靠的信息资源，提高了内容的可信度和连贯性，满足用户深入探索和理解的需求。",
        },
        {
          title: "阅 读",
          key: "read",
          explain: "单文件和多文件阅读",
          des: "支持知识库导入和本地上传两种文件导入方式。单文件阅读和多文件阅读可自由切换，单文件阅读会话历史关联到具体文件，多文件阅读会话历史关联到具体任务，确保各个阅读会话的独立性。",
        },
        {
          title: "搜 索",
          key: "search",
          explain: "AI检索和关键词检索",
          des: "AI生成搜索答案并提供参考文献，同步采用向量数据库Hippo和分布式搜索引擎Scope对搜索结果进行召回，以提高搜索效率和结果相关性，从而为用户提供更全面、可信赖的信息资源。",
        },
        {
          title: "写 作",
          key: "write",
          explain: "按段落要点分段生成",
          des: "支持配置大模型和素材库，提供手动导入和智能生成两种方式，生成段落模板。这些模板可自由编辑，还可以添加专属的参考文献，以满足不同写作任务的要求，提高文本的质量和可信度。",
        },
      ],
    });

    const router = useRouter();

    //继续聊天
    const startChat = () => {
      router.push("/chat");
    };

    //点击卡片页，切换路由
    const changeRoute = (key) => {
      router.push(`/${key}`);
    };

    return {
      ...toRefs(description),
      startChat,
      changeRoute,
    };
  },
};
</script>
<style lang="less">
@import url(./index.less);
</style>
