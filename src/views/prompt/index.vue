<template>
  <div class="prompt">
    <div class="prompt-header">我的promt</div>
    <div class="prompt-table-header">
      <div class="header-btns">
        <a-button type="primary" class="header-btn" @click="handleAddPrompt">
          <icon-svg icon-class="icon-plus" />
          新增prompt
        </a-button>
      </div>
      <div class="header-actions">
        <div class="header-action" @click="handleChangeShowType">
          <icon-svg icon-class="view-list" v-show="showType === 'table'" />
          <icon-svg icon-class="view-table" v-show="showType === 'list'" />
        </div>
        <a-popover
          placement="bottomRight"
          trigger="click"
          overlayClassName="sort-popover"
          v-model:visible="visible"
        >
          <template #content>
            <div class="content-item">
              <p>排序列：</p>
              <a-select
                allowClear
                placeholder="请选择"
                :options="sortColumns"
                v-model:value="sortColumn"
              />
            </div>
            <div class="content-item">
              <p>排序方式：</p>
              <a-select
                allowClear
                placeholder="请选择"
                :options="sortWays"
                v-model:value="sortValue"
              />
            </div>
            <div class="content-item">
              <a-button @click="visible = false">取消</a-button>
              <a-button type="primary" @click="sortConfirm">确定</a-button>
            </div>
          </template>
          <div class="header-action">
            <icon-svg icon-class="icon-switch" />
          </div>
        </a-popover>
        <div class="header-action" @click="handleBatchDelete">
          <icon-svg icon-class="icon-delete" />
        </div>
      </div>
    </div>
    <TableComponent
      v-show="showType === 'table'"
      :dataSource="data"
      :columns="columns"
      :pagination="pagination"
      :loading="tableLoading"
      :row-selection="rowSelection"
    >
      <template #actions="{ record }">
        <a-menu>
          <a-menu-item
            :key="item.key"
            v-for="item in menuList"
            @click="handleAction(item, record)"
          >
            <icon-svg :icon-class="`icon-${item.key}`" />{{
              item.title
            }}</a-menu-item
          >
        </a-menu>
      </template>
    </TableComponent>
    <ListComponent
      v-show="showType === 'list'"
      :list="data"
      :pagination="pagination"
      itemClassName="promt-item"
      @onSelectChange="onSelectChange"
    >
      <template #listItem="{ item }">
        <div class="item-title" :title="item.name">
          <span class="item-title-text">{{ item.name }}</span>
          <a-checkbox :checked="selectedRowKeys.indexOf(item.id) > -1" />
        </div>
        <div class="item-content">
          {{ item.prompt }}
        </div>
        <div class="item-footer">
          <div
            class="item-footer-icon"
            v-for="menu in menuList"
            :key="menu.key"
            @click="handleAction(menu, item)"
          >
            <icon-svg :icon-class="`icon-${menu.key}`" />
          </div>
        </div>
      </template>
    </ListComponent>
  </div>
  <a-modal
    v-model:visible="isPromptShow"
    title="新增prompt"
    @ok="promptConfirm"
    @cancel="promptCancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="600px"
    class="prompt-modal"
    :maskClosable="false"
  >
    <div class="prompt-modal-content">
      <div class="item" style="margin-bottom: 16px">
        <div class="name">名称：</div>
        <a-input
          v-model:value.trim="promptName"
          placeholder="请输入名称"
          :maxlength="60"
        />
      </div>
      <div class="item">
        <div class="name">prompt：</div>
        <a-textArea
          v-model:value.trim="promptContent"
          placeholder="请输入prompt"
          allow-clear
          :auto-size="{ minRows: 4, maxRows: 4 }"
        />
      </div>
    </div>
  </a-modal>
  <a-modal
    v-model:visible="isReNameShow"
    title="prompt重命名"
    @ok="reNameConfirm"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="600px"
    class="prompt-modal"
    :maskClosable="false"
  >
    <div class="prompt-modal-content">
      <div class="item">
        <div class="name">名称：</div>
        <a-input
          v-model:value.trim="newName"
          placeholder="请输入名称"
          @pressEnter="reNameConfirm"
        />
      </div>
    </div>
  </a-modal>
</template>

<script>
import ListComponent from "@/components/listComponent";
import TableComponent from "@/components/tableComponent";
import {
  addPrompt,
  batchDeletePrompt,
  delPromptById,
  searchPromptList,
  updatePrompt,
} from "@/shared/api/prompt";
import { modalConfirm } from "@/utils/common";
import {
  Button,
  Checkbox,
  Input,
  Menu,
  Modal,
  Popover,
  Select,
  message,
} from "ant-design-vue";
import { onMounted, reactive, ref, toRefs } from "vue";

const { TextArea } = Input;

export default {
  name: "Prompt",
  components: {
    AButton: Button,
    ACheckbox: Checkbox,
    AInput: Input,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    AModal: Modal,
    APopover: Popover,
    ASelect: Select,
    ATextArea: TextArea,
    ListComponent,
    TableComponent,
  },
  setup() {
    const columns = [
      {
        title: "名称",
        dataIndex: "name",
        width: 240,
        ellipsis: true,
      },
      {
        title: "创建时间",
        dataIndex: "createTime",
        width: 200,
      },
      {
        title: "prompt",
        dataIndex: "prompt",
        width: 827,
        ellipsis: true,
      },
      {
        title: "操作",
        dataIndex: "action",
        width: 60,
      },
    ];
    const data = ref([]);
    const tableLoading = ref(false);
    const sort = reactive({
      visible: false,
      sortColumns: [
        {
          value: 0,
          label: "创建时间",
        },
      ],
      sortWays: [
        {
          value: "asc",
          label: "升序",
        },
        {
          value: "desc",
          label: "降序",
        },
        {
          value: "no",
          label: "不排序",
        },
      ],
      sortColumn: undefined,
      sortValue: undefined,
    }); // 排序数据
    const sortConfirm = () => {
      if (!sort.sortColumn && sort.sortColumn !== 0 && sort.sortValue) {
        return message.warning("请选择想要排序的列！");
      }
      if (!sort.sortValue && (sort.sortColumn || sort.sortColumn === 0)) {
        return message.warning("请选择排序方式！");
      }
      sort.visible = false;
      getList();
    };

    const pagination = reactive({
      size: "small",
      total: 1,
      current: 1,
      pageSize: 15,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ["5", "10", "15", "20"],
      showTotal: (total, current) => {
        return `共${total}条记录，当前第${Math.ceil(
          current[0] / pagination.pageSize
        )}页`;
      },
      onChange: (page, pageSize) => {
        pagination.current = page;
        pagination.pageSize = pageSize;
        getList();
      },
    });
    const selectedRowKeys = ref([]);
    const onSelectChange = (keys) => {
      selectedRowKeys.value = keys;
    };
    const rowSelection = reactive({
      columnWidth: 60,
      selectedRowKeys: selectedRowKeys,
      onChange: onSelectChange,
    });

    const showType = ref("table"); // 数据展示形式
    const handleChangeShowType = () => {
      if (showType.value === "table") {
        showType.value = "list";
      } else {
        showType.value = "table";
      }
    };

    const menuList = ref([
      {
        key: "edit",
        title: "重命名",
      },
      {
        key: "delete",
        title: "删除",
      },
    ]);

    //新增Prompt
    const promptName = ref(undefined);
    const promptContent = ref(undefined);
    const isPromptShow = ref(false);
    const handleAddPrompt = () => {
      isPromptShow.value = true;
    };
    const promptConfirm = async () => {
      if (!promptName.value.trim()) {
        return message.warning("请输入新增prompt的名称！");
      }
      if (!promptContent.value.trim()) {
        return message.warning("请输入新增prompt的内容！");
      }
      const json = {
        promptName: promptName.value.trim(),
        prompt: promptContent.value.trim(),
      };
      // const loading = message.loading("正在操作", 0);
      const res = await addPrompt(json);
      // loading();
      if (res.message === "成功") {
        // message.success("新增prompt成功！");
        getList();
        promptCancel();
      } else {
        message.error(res.message);
      }
    };
    const promptCancel = () => {
      isPromptShow.value = false;
      promptName.value = undefined;
      promptContent.value = undefined;
    };

    //获取列表
    const getList = async () => {
      const json = {
        sortType: sort.sortColumn,
        asc:
          sort.sortValue === "asc"
            ? true
            : sort.sortValue === "desc"
            ? false
            : undefined,
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
      };
      tableLoading.value = true;
      const res = await searchPromptList(json);
      tableLoading.value = false;
      if (res.message === "成功") {
        if (res.data) {
          pagination.total = res.data.totalCount;
          data.value =
            (res.data.dateList &&
              res.data.dateList.map((item) => ({
                key: item.id,
                name: item.promptName,
                prompt: item.prompt,
                url: require("@/assets/images/img/file-prompt.svg"),
                createTime: item.updateDate || item.createDate,
                id: item.id,
              }))) ||
            [];
        }
      } else {
        message.error(res.message);
      }
    };

    //根据id删除、重命名
    const currentRecord = ref({});
    const handleAction = (item, record) => {
      console.log("111111111", item, record);
      if (item.title === "重命名") {
        isReNameShow.value = true;
        newName.value = record.name;
        currentRecord.value = record;
      } else if (item.title === "删除") {
        const title = "是否确认删除该prompt？";
        const content =
          "该操作将删除目标文件，该操作不可撤回，请确认是否继续删除？";
        const onOk = async () => {
          // const loading = message.loading("正在删除", 0);
          const res = await delPromptById(record.id);
          // loading();
          if (res.message === "成功") {
            // message.success("prompt删除成功！");
            getList();
          } else {
            message.error(res.message);
          }
        };
        modalConfirm(title, content, onOk);
      }
    };

    //重命名prompt
    const isReNameShow = ref(false);
    const newName = ref("");
    const reNameConfirm = async () => {
      if (newName.value.trim() === "") {
        return message.warning("prompt名称不可为空！");
      }
      const json = {
        id: currentRecord.value.id,
        promptName: newName.value.trim(),
        prompt: currentRecord.value.prompt,
      };
      // const loading = message.loading("正在操作", 0);
      const res = await updatePrompt(json);
      // loading();
      if (res.message === "成功") {
        // message.success("prompt重命名成功！");
        isReNameShow.value = false;
        getList();
      } else {
        message.error(res.message);
      }
    };

    // 批量删除文件
    const handleBatchDelete = async () => {
      if (!selectedRowKeys.value.length) {
        return message.warning("请选择想要删除的prompt！");
      }
      const title = "是否删除任务？";
      const content =
        "该操作将删除所选目标任务，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        // const loading = message.loading("正在删除", 0);
        const res = await batchDeletePrompt(selectedRowKeys.value);
        // loading();
        if (res.message === "成功") {
          // message.success("删除成功！");
          selectedRowKeys.value = []; // 否则后续继续点击批量删除按钮，保存id的仍然是上一次所选中的Prompt
          getList();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    onMounted(async () => {
      getList();
    });

    return {
      data,
      columns,
      pagination,
      rowSelection,
      showType,
      menuList,
      tableLoading,
      ...toRefs(sort),
      sortConfirm,
      selectedRowKeys,

      onSelectChange,
      handleChangeShowType,

      isPromptShow,
      promptName,
      handleAddPrompt,
      promptContent,
      promptConfirm,
      promptCancel,
      getList,
      currentRecord,
      handleAction,
      isReNameShow,
      newName,
      reNameConfirm,
      handleBatchDelete,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
