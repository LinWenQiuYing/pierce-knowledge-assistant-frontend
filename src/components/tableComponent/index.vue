<template>
  <a-table
    :class="['table-component', className]"
    :columns="columns"
    :data-source="dataSource"
    :pagination="pagination"
    :scroll="scroll"
    :loading="loading"
    :row-selection="rowSelection"
    :customRow="customRow"
  >
    <template #bodyCell="{ column, text, record }">
      <template v-if="column.dataIndex === 'name'">
        <div class="name-slot">
          <img v-if="record.url" :src="record.url" alt="" />
          <span :title="text">{{ text }}</span>
        </div>
      </template>
      <template v-if="column.dataIndex === 'clickName'">
        <slot name="clickName" :record="record" :text="text" />
      </template>
      <template v-if="column.dataIndex === 'statusText'">
        <slot name="statusText" :text="text" :record="record" />
      </template>
      <template v-if="column.dataIndex === 'action'">
        <div class="table-actions">
          <slot name="actionsOut" :record="record"></slot>
          <a-dropdown overlayClassName="table-actions">
            <a class="ant-dropdown-link">
              <ellipsis-outlined />
            </a>
            <template #overlay>
              <slot name="actions" :record="record" />
            </template>
          </a-dropdown>
        </div>
      </template>
      <template v-if="column.dataIndex === 'readAction'">
        <slot name="actions" :record="record" />
      </template>
    </template>
  </a-table>
</template>
<script>
import { Dropdown, Table } from "ant-design-vue";
import { ref, toRefs } from "vue";

export default {
  name: "tableComponent",
  components: {
    ADropdown: Dropdown,
    ATable: Table,
  },
  props: {
    className: {
      type: String,
      default: "",
    },
    columns: {
      type: Object,
      required: true,
    },
    dataSource: {
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
    scroll: {
      type: Object,
      default: () => ({ x: "100%", y: "calc(100vh - 290px)" }),
    },
    rowSelection: {
      type: [Object, null],
      default: null,
    },
    customRow: {
      default: null,
    },
  },
  setup(props) {
    const visible = ref(false); // 下拉菜单是否展示
    const activeKey = ref(undefined);

    return {
      ...toRefs(props),
      visible,
      activeKey,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
