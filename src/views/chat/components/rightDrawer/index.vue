<template>
  <div class="right-drawer">
    <div class="right-drawer-top">
      <div class="left">
        <close-outlined @click="closeRightShow(false)" />
        <div class="left-title">{{ referTitle }}</div>
      </div>
      <div class="right">
        <!-- <span class="right-href">查看原文</span> -->
      </div>
    </div>
    <div class="right-drawer-content">
      <refer></refer>
    </div>
    <!-- <div class="right-drawer-content-question">
      <question></question>
    </div> -->
  </div>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
// import Question from "./components/question";
import Refer from "./components/refer";

export default {
  name: "RightDrawer",
  components: {
    Refer,
    // Question,
  },
  //props: ["reference"],
  emits: ["handleRightShow"],
  setup(props, { emit }) {
    const store = useStore();
    //是否展示右侧参考文献
    const closeRightShow = (value) => {
      emit("handleRightShow", value);
      store.dispatch("referStore/updateReferTitle", "");
      store.dispatch("referStore/updateReferContent", "");
    };

    return {
      closeRightShow,
      referTitle: computed(() => store.state.referStore.referTitle),
    };
  },
};
</script>
<style lang="less">
.right-drawer {
  &-top {
    width: 100%;
    height: 56px;
    padding: 17px 24px 17px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--grey-200);

    .left {
      width: 100%;
      display: flex;
      align-items: center;

      &-title {
        height: 22px;
        line-height: 22px;
        width: calc(100% - 24px);
        font-size: 16px;
        font-weight: 600;
        color: var(--mainTextColor);
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        white-space: nowrap;
      }

      svg {
        font-size: 16px;
        margin-right: 8px;
      }
    }

    .right {
      &-href {
        font-size: 14px;
        color: var(--blue);
        cursor: pointer;
      }
    }
  }

  &-content {
    width: 100%;
    padding: 16px 24px 0px 24px;
  }
  &-content-question {
    width: 100%;
    padding: 16px 24px 16px 24px;
  }
}
</style>
