<template>
  <a-spin tip="正在加载" v-if="loading" class="file-reader-loading" />
  <div ref="rootRef" class="file-docx"></div>
</template>
<script>
import { Spin } from "ant-design-vue";
import { computed, ref, watch } from "vue";
import { getData, render } from "./docx";

export default {
  name: "Docx",
  props: {
    src: {
      type: String,
      require: true,
    },
    docxLoading: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    ASpin: Spin,
  },
  setup(props, { emit }) {
    const rootRef = ref(null);
    const loading = computed({
      get: () => {
        return props.docxLoading;
      },
      set: (newVal) => {
        emit("update:docxLoading", newVal);
      },
    });

    const init = () => {
      loading.value = true;
      let container = rootRef.value;
      getData(props.src)
        .then((res) => {
          render(res, container)
            .then(() => {
              loading.value = false;
            })
            .catch((e) => {
              render("", container);
              loading.value = false;
              console.log("error1", e);
            });
        })
        .catch((e) => {
          loading.value = false;
          render("", container);
          console.log("error2", e);
        });
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
      rootRef,
      loading,
    };
  },
};
</script>
<style lang="less" scoped></style>
