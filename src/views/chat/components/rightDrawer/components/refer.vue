<template>
  <div class="right-drawer-content-doc">
    <div class="doc-title">
      <div class="doc-title-left">
        <img alt="doc" class="img" src="@/assets/images/img/doc.svg" />
        <span class="des">文献信息</span>
      </div>
      <div class="doc-title-right" @click="handleRefer" v-show="referFlag">
        <img alt="qes" class="img" src="@/assets/images/img/up.svg" />
      </div>
      <div class="doc-title-right" @click="handleRefer" v-show="!referFlag">
        <img alt="qes" class="img" src="@/assets/images/img/down.svg" />
      </div>
    </div>
    <div class="doc-detail" v-show="referFlag">
      <div class="doc-detail-des">
        <span class="name">文献名称：</span>
        <a-tooltip>
          <template #title>{{ referTitle }}</template>
          <span class="content">{{ referTitle }}</span>
        </a-tooltip>
      </div>
      <div class="doc-detail-des">
        <span class="name">上传时间：</span>
        <span class="content">{{ referTime }}</span>
      </div>
      <div class="doc-detail-des">
        <span class="name">上传人：</span>
        <span class="content">{{ referAuthor }}</span>
      </div>
      <div class="doc-detail-refer">{{ referContent }}</div>
      <div class="doc-detail-bottom">
        <a-tooltip placement="top" title="复制">
          <img
            alt="copy"
            class="img"
            src="@/assets/images/img/copy.svg"
            @click="copy(referContent)"
          />
        </a-tooltip>

        <!-- <a-divider type="vertical" />
        <a-tooltip placement="top" title="分享">
          <img alt="share" class="img" src="@/assets/images/img/share.svg" />
        </a-tooltip> -->
      </div>
    </div>
  </div>
</template>
<script>
import { handleCopy } from "@/utils/common.js";
import { Tooltip } from "ant-design-vue";
import { computed, ref } from "vue";
import { useStore } from "vuex";

export default {
  name: "Refer",
  components: {
    // ADivider: Divider,
    ATooltip: Tooltip,
  },
  setup() {
    const store = useStore();

    //文献信息
    const referFlag = ref(true);
    const handleRefer = () => {
      referFlag.value = !referFlag.value;
    };

    //复制
    const copy = (text) => {
      handleCopy(text);
    };

    return {
      referFlag,
      handleRefer,
      copy,
      referTitle: computed(() => store.state.referStore.referTitle),
      referContent: computed(() => store.state.referStore.referContent),
      referTime: computed(() => store.state.referStore.referTime),
      referAuthor: computed(() => store.state.referStore.referAuthor),
    };
  },
};
</script>
<style lang="less">
.right-drawer-content-doc {
  width: 100%;
  background: var(--white);
  border-radius: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  //max-height: 620px;
  //max-height: 676px;

  .doc-title {
    display: flex;
    padding: 0px 12px 0px 12px;
    justify-content: space-between;
    align-items: center;

    &-left {
      display: flex;
      align-items: center;

      .img {
        margin-right: 8px;
      }

      .des {
        font-size: 14px;
        color: var(--mainTextColor);
      }
    }

    &-right {
      cursor: pointer;
    }
  }

  .doc-detail {
    margin-top: 16px;
    padding: 0px 12px 0px 12px;

    &-des {
      width: 100%;
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      cursor: pointer;

      .name {
        display: inline-block;
        width: 70px;
        height: 20px;
        font-size: 14px;
        color: var(--grey-400);
      }

      .content {
        display: inline-block;
        height: 20px;
        width: calc(100% - 70px);
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--mainTextColor);
      }
    }

    &-refer {
      max-height: 500px;
      //max-height: 244px;
      //max-height: 200px;
      overflow-y: scroll;
      margin-bottom: 12px;
    }

    &-bottom {
      display: flex;
      justify-content: end;

      .img {
        cursor: pointer;
      }

      .ant-divider {
        color: red;
      }
    }
  }
}
</style>
