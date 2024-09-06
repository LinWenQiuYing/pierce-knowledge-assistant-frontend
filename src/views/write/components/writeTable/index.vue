<template>
  <div class="write-table">
    <div class="write-header">写作任务</div>
    <div class="write-table-header">
      <div class="header-btns">
        <a-button type="primary" class="header-btn" @click="addTask">
          <icon-svg icon-class="icon-plus" />
          新建任务
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
      :dataSource="dataSource"
      :columns="columns"
      :pagination="pagination"
      :loading="tableLoading"
      :row-selection="rowSelection"
      class="read-table"
      :customRow="rowClick"
    >
      <template #clickName="{ record, text }">
        <div class="click-name-slot">
          <span :title="text" @click.stop="handleTaskDetail(record)">{{
            text
          }}</span>
        </div>
      </template>
      <template #actions="{ record }">
        <div class="action">
          <div
            class="action-item"
            :key="item.key"
            v-for="item in menuList"
            @click.stop="handleAction(item.key, record)"
          >
            <icon-svg :icon-class="`icon-${item.key}`" />{{ item.title }}
          </div>
        </div>
      </template>
    </TableComponent>
    <ListComponent
      v-show="showType === 'list'"
      :list="dataSource"
      :pagination="pagination"
      itemClassName="read-item"
      @onSelectChange="onSelectChange"
      @handleDblClick="handleTaskDetail"
    >
      <template #listItem="{ item }">
        <div class="item-top">
          <div class="item-title">
            <span
              class="title-text"
              @click.stop="handleTaskDetail(item)"
              :title="item.clickName"
              >{{ item.clickName }}</span
            >
            <a-checkbox :checked="selectedRowKeys.indexOf(item.id) > -1" />
          </div>

          <div class="item-top-bottom">
            <img src="@/assets/images/img/icon-time.svg" alt="" />
            {{ item.updateTime }}
          </div>
        </div>
        <div class="item-footer">
          <div
            class="item-footer-icon"
            v-for="menu in menuList"
            :key="menu.key"
            @click.stop="handleAction(menu.key, item)"
          >
            <icon-svg :icon-class="`icon-${menu.key}`" />
          </div>
        </div>
      </template>
    </ListComponent>
  </div>
  <a-modal
    v-model:visible="isModalShow"
    :title="modalTitle"
    @ok="handleConfirm"
    @cancel="handleCancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="600px"
    class="write-modal"
    :maskClosable="false"
  >
    <div class="write-modal-content">
      <div class="item">
        <div class="name">名称：</div>
        <a-input
          v-model:value.trim="newName"
          placeholder="请输入名称"
          :maxlength="60"
          @pressEnter="handleConfirm"
        />
      </div>
    </div>
  </a-modal>
</template>
<script>
import ListComponent from "@/components/listComponent";
import TableComponent from "@/components/tableComponent";
import {
  batchDeleteWriteTask,
  createWriteTask,
  deleteWriteTask,
  getWriteDetail,
  getWriteList,
  updateWriteTask,
} from "@/shared/api/write";
import { modalConfirm } from "@/utils/common";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Popover,
  Select,
  message,
} from "ant-design-vue";
import { onMounted, reactive, ref, toRefs } from "vue";

export default {
  name: "WriteTable",
  components: {
    AButton: Button,
    ACheckbox: Checkbox,
    AInput: Input,
    AModal: Modal,
    APopover: Popover,
    ASelect: Select,
    ListComponent,
    TableComponent,
  },
  emits: ["changeDetailShow", "changeDetailData"],
  setup(props, { emit }) {
    const params = reactive({
      showType: "table",
      tableLoading: false,
      dataSource: [],
      columns: [
        {
          title: "任务名称",
          dataIndex: "clickName",
          width: 923,
          ellipsis: true,
        },
        {
          title: "最近打开时间",
          dataIndex: "updateTime",
          width: 200,
        },
        {
          title: "操作",
          dataIndex: "readAction",
          width: 204,
        },
      ],
      menuList: [
        {
          key: "edit",
          title: "重命名",
        },
        // {
        //   key: "detail",
        //   title: "查看详情",
        // },
        {
          key: "delete",
          title: "移除任务",
        },
      ],
    });

    const selectedRowKeys = ref([]); // 只能单独写，放到reactive中，rowSelection的selectedRowKeys会丢失响应式
    const onSelectChange = (keys) => {
      console.log("onSelectChange", keys);
      selectedRowKeys.value = keys;
    };
    // 表格勾选
    const rowSelection = reactive({
      columnWidth: 60,
      selectedRowKeys: selectedRowKeys,
      onChange: onSelectChange,
    });

    //分页
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

    // 更换任务列表展示方式
    const handleChangeShowType = () => {
      if (params.showType === "table") {
        params.showType = "list";
      } else {
        params.showType = "table";
      }
    };

    // 排序数据
    const sort = reactive({
      visible: false, // 排序是否展示
      sortColumns: [
        {
          value: 0,
          label: "最近打开时间",
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
      sortColumn: undefined, //所选排序列
      sortValue: undefined, //所选排序方式
    });

    // 排序确认
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

    // 弹窗数据
    const modalParams = reactive({
      isModalShow: false,
      modalTitle: "",
      newName: null,
      currentRecord: null,
    });

    // 新增任务
    const addTask = () => {
      modalParams.modalTitle = "新建任务";
      modalParams.isModalShow = true;
    };

    // 重命名任务
    const reName = async () => {
      if (modalParams.newName.trim() === "") {
        return message.warning("任务名称不可为空！");
      }
      const json = {
        id: modalParams.currentRecord.id,
        taskName: modalParams.newName.trim(),
      };
      // const loading = message.loading("正在操作", 0);
      const res = await updateWriteTask(json);
      // loading();
      if (res.message === "成功") {
        // message.success("任务重命名成功！");
        handleCancel();
        getList();
      } else {
        message.error(res.message);
      }
      getList();
    };

    // 新建任务
    const createTask = async () => {
      if (modalParams.newName.trim() === "") {
        return message.warning("任务名称不可为空！");
      }
      const json = {
        taskName: modalParams.newName,
      };
      const res = await createWriteTask(json);
      if (res.message === "成功") {
        // message.success("新建任务成功！");
        handleCancel();
        getList();
      } else {
        message.error(res.message);
      }
    };

    // modal确认
    const handleConfirm = async () => {
      switch (modalParams.modalTitle) {
        case "重命名任务":
          reName();
          break;
        case "新建任务":
          createTask();
          break;
        default:
          break;
      }
    };

    // modal取消
    const handleCancel = () => {
      modalParams.isModalShow = false;
      modalParams.newName = null;
    };

    // 批量删除任务
    const handleBatchDelete = async () => {
      if (!selectedRowKeys.value.length) {
        return message.warning("请选择想要删除的写作任务！");
      }
      const title = "是否删除任务？";
      const content =
        "该操作将删除所选目标任务，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        // const loading = message.loading("正在删除", 0);
        const res = await batchDeleteWriteTask(selectedRowKeys.value);
        // loading();
        if (res.message === "成功") {
          // message.success("删除成功！");
          selectedRowKeys.value = []; //否则后续继续点击批量删除按钮，保存的仍然是上一次所选中的任务
          getList();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    // 获取任务列表
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
      params.tableLoading = true;
      const res = await getWriteList(json);
      params.tableLoading = false;
      if (res.message === "成功") {
        if (res.data) {
          pagination.total = res.data.totalCount;
          params.dataSource =
            (res.data.dateList &&
              res.data.dateList.map((item) => ({
                key: item.id,
                id: item.id,
                clickName: item.taskName,
                updateTime: item.updateDate || item.createDate,
              }))) ||
            [];
        }
      } else {
        message.error(res.message);
      }
    };

    // 查看任务详情
    const handleTaskDetail = async (record) => {
      const res = await getWriteDetail(record.id);
      if (res.message === "成功") {
        const detailData = {
          id: record.id,
        };
        if (res.data) {
          detailData.writeTitle = res.data.writingTitle;
          // 处理writeContent
          detailData.writeContent =
            (res.data.question && res.data.question.question) || "";
          if (res.data.question && res.data.question.refFileList) {
            res.data.question.refFileList.map((file) => {
              detailData.writeContent += `<span class="at-span" data-key="${file.id}" data-type="template">@${file.fileName}</span>`;
            });
          }
          // detailData.selectModel = res.data.selectModel;
          detailData.freedomValue = res.data.freedom;
          detailData.writeNumber =
            (res.data.question && res.data.question.writingLength) || undefined;
          detailData.fileList =
            (res.data.refFileList &&
              res.data.refFileList.map((item) => ({
                id: item.id,
                label: item.fileName,
              }))) ||
            [];
          detailData.template =
            res.data.paraQueryList &&
            res.data.paraQueryList.map((item, index) => {
              item.refFileList.map((file) => {
                item.question += `<span class="at-span" data-key="${file.id}" data-type="paragraph" data-index="${index}">@${file.fileName}</span>`;
              });
              return {
                title: item.title,
                content: item.question,
                fileIds: item.refFileList.map((item) => item.id),
                writeNumber: item.writingLength,
              };
            });
          detailData.templateReferFiles =
            (res.data.question &&
              res.data.question.refFileList.map((item) => item.id)) ||
            [];
        }
        console.log("changeDetailData", detailData);
        emit("changeDetailData", detailData);
        emit("changeDetailShow", true);
      } else {
        message.error(res.message);
      }
    };

    let clickType = false; // 是否是双击事件，解决双击事件会触发单击事件的bug
    // 点击表格行
    const rowClick = (record) => {
      return {
        onClick: (e) => {
          // 单击行——选中该行
          clickType = false;
          setTimeout(async () => {
            if (clickType) return;
            console.log("onClick", e, record);
            const keys = selectedRowKeys.value;
            const index = keys.indexOf(record.key);
            if (index === -1) {
              // 不存在，则选中
              keys.push(record.key);
            } else {
              // 存在，则取消选中
              keys.splice(index, 1);
            }
            onSelectChange(keys);
          }, 500);
        },
        onDblclick: (e) => {
          // 双击行——查看详情
          console.log("onDblclick", e, record);
          clickType = true;
          handleTaskDetail(record);
        },
      };
    };

    // 移除任务
    const handleDeleteTask = (record) => {
      const title = "是否删除该任务？";
      const content =
        "该操作将删除目标任务，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        // const loading = message.loading("正在删除", 0);
        const res = await deleteWriteTask(record.id);
        // loading();
        if (res.message === "成功") {
          // message.success("任务删除成功！");
          getList();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    // 点击表格操作栏
    const handleAction = async (key, record) => {
      switch (key) {
        case "edit":
          modalParams.modalTitle = "重命名任务";
          modalParams.isModalShow = true;
          modalParams.newName = record.clickName;
          modalParams.currentRecord = record;
          break;
        case "detail":
          handleTaskDetail(record);
          break;
        case "delete":
          handleDeleteTask(record);
          break;

        default:
          break;
      }
    };

    onMounted(() => {
      getList();
    });

    return {
      ...toRefs(params),
      ...toRefs(sort),
      ...toRefs(modalParams),
      selectedRowKeys,
      rowSelection,
      pagination,
      addTask,
      handleChangeShowType,
      sortConfirm,
      handleBatchDelete,
      handleConfirm,
      handleCancel,
      handleAction,
      onSelectChange,
      handleTaskDetail,
      rowClick,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
