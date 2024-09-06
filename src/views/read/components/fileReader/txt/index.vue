<template>
  <a-spin tip="正在加载" v-if="loading" class="file-reader-loading" />
  <div class="file-txt" v-html="txtContent"></div>
</template>
<script>
import { Spin } from "ant-design-vue";
import { computed, ref, watch } from "vue";
import { getData } from "./txt.js";

export default {
  name: "Txt",
  props: {
    src: {
      type: String,
      require: true,
    },
    txtLoading: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    ASpin: Spin,
  },
  setup(props, { emit }) {
    const txtContent = ref(null);
    const loading = computed({
      get: () => {
        return props.txtLoading;
      },
      set: (newVal) => {
        emit("update:txtLoading", newVal);
      },
    });

    const init = async () => {
      loading.value = true;
      const res = await getData(props.src);
      loading.value = false;
      if (typeof res === "string") {
        txtContent.value = res;
      }
    };

    watch(
      () => props.src,
      () => {
        if (props.src) {
          init();
        }
      },
      { immediate: true }
    );
    return {
      txtContent,
      loading,
    };
  },
};
</script>
<style lang="less" scoped></style>
