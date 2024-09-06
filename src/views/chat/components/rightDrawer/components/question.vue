<template>
  <div class="right-drawer-content-qes">
    <div class="qes-top">
      <div class="qes-top-left">
        <img alt="qes" class="img" src="@/assets/images/img/url.svg" />
        <span class="des">相关问题</span>
      </div>
      <div class="qes-top-right" @click="handleQues" v-show="quesFlag">
        <img alt="qes" class="img" src="@/assets/images/img/up.svg" />
      </div>
      <div class="doc-top-right" @click="handleQues" v-show="!quesFlag">
        <img alt="qes" class="img" src="@/assets/images/img/down.svg" />
      </div>
    </div>
    <div class="qes-detail" v-show="quesFlag">
      <div class="qes-detail-item">
        <div class="qes-detail-item-search">
          <img alt="qes" class="img" src="@/assets/images/img/search.svg" />
        </div>
        <span class="title">中国前20的公募基金</span>
      </div>
      <div class="qes-detail-item">
        <div class="qes-detail-item-search">
          <img alt="qes" class="img" src="@/assets/images/img/search.svg" />
        </div>
        <span class="title">中国前20的公募基金</span>
      </div>
      <div class="qes-detail-item">
        <div class="qes-detail-item-search">
          <img alt="qes" class="img" src="@/assets/images/img/search.svg" />
        </div>
        <span class="title">中国前20的公募基金</span>
      </div>
      <div class="qes-detail-item">
        <div class="qes-detail-item-search">
          <img alt="qes" class="img" src="@/assets/images/img/search.svg" />
        </div>
        <span class="title">中国前20的公募基金</span>
      </div>
      <div class="qes-detail-item">
        <div class="qes-detail-item-search">
          <img alt="qes" class="img" src="@/assets/images/img/search.svg" />
        </div>
        <span class="title">中国前20的公募基金</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  name: "Question",
  setup() {
    //文献信息和相关问题
    const quesFlag = ref(true);
    const handleQues = () => {
      quesFlag.value = !quesFlag.value;
    };
    return {
      quesFlag,
      handleQues,
    };
  },
};
</script>
<style lang="less">
.right-drawer-content-qes {
  width: 100%;
  background: var(--white);
  border-radius: 8px;
  padding-top: 12px;
  padding-bottom: 12px;

  .qes-top {
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
    }

    &-right {
      .img {
        cursor: pointer;
      }
    }
  }

  .qes-detail {
    max-height: 150px;
    overflow-y: scroll;
    margin-top: 16px;
    padding: 0px 12px 0px 12px;

    &-item {
      height: 44px;
      display: flex;
      align-items: center;
      padding: 0px 12px 0px 12px;

      &-search {
        width: 20px;
        height: 20px;
        margin-right: 8px;
        border-radius: 6px;
        background: linear-gradient(45deg, var(--blue) 6.74%, #c3dcff 91.89%);
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .title {
        font-size: 14px;
        color: var(--mainTextColor);
      }
    }
  }
}
</style>
