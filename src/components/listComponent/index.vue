<template>
  <div class="list-component">
    <a-spin v-if="loading" class="list-component-spin" />
    <div
      v-else-if="!loading && list.length"
      :class="['list-component-item', itemClassName]"
      v-for="(item, index) in list"
      :key="index"
      @click="handleSelectItem(item.key)"
      @dblclick="handleDblClick(item)"
    >
      <slot name="listItem" :item="item" />
    </div>
    <div class="no-content" v-else>暂无数据</div>
    <a-pagination
      :size="size"
      :total="total"
      :showTotal="showTotal"
      v-model:current="current"
      v-model:page-size="pageSize"
      class="list-component-pagination"
      :showSizeChanger="showSizeChanger"
      :showQuickJumper="showQuickJumper"
      :pageSizeOptions="pageSizeOptions"
      @change="onChange"
    />
  </div>
</template>
<script>
import { Pagination, Spin } from "ant-design-vue";
import { findIndex } from "lodash";
import { ref, toRefs, watch } from "vue";

export default {
  name: "ListComponent",
  components: {
    APagination: Pagination,
    ASpin: Spin,
  },
  props: {
    itemClassName: {
      type: String,
      default: "",
    },
    list: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pagination: {
      type: Object,
      default: () => ({
        size: "small",
        total: 0,
        current: 1,
        pageSize: 15,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ["5", "10", "15", "20"],
      }),
    },
  },
  emits: ["onSelectChange"],
  setup(props, { emit }) {
    const selectedList = ref([]); // 被选中的item

    const handleSelectItem = (key) => {
      clickType = false;
      setTimeout(async () => {
        if (clickType) return;
        const index = findIndex(selectedList.value, (v) => v === key);
        if (index > -1) {
          // 包含则删除
          selectedList.value.splice(index, 1);
        } else {
          // 不包含则添加
          selectedList.value.push(key);
        }
        emit("onSelectChange", selectedList.value);
      }, 500);
    };

    let clickType = false; // 是否是双击事件，解决双击事件会触发单击事件的bug

    const handleDblClick = (item) => {
      clickType = true;
      emit("handleDblClick", item);
    };

    watch(
      () => props.list,
      () => {
        // 每当list发生变化时，重置selectedList
        selectedList.value = [];
      },
      { immediate: true }
    );

    return {
      selectedList,
      ...toRefs(props),
      ...toRefs(props.pagination),

      handleSelectItem,
      handleDblClick,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
