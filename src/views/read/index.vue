<template>
  <div class="read" v-if="showDetail">
    <left-menu
      :tData="tData"
      :taskDetailId="taskDetailId"
      :currentFile="currentFile"
      :abortController="abortController"
      @changeTaskId="changeTaskId"
      @changeConversationId="changeConversationId"
      @changeIsReadyForChat="changeIsReadyForChat"
      @changeCurrentFile="changeCurrentFile"
      @changeReaderShow="changeReaderShow"
      @changeFileMd5List="changeFileMd5List"
      @changeContent="changeContent"
      @changeQuesInput="changeQuesInput"
      @changeShowDetail="changeShowDetail"
      @changeCopyContent="changeCopyContent"
    ></left-menu>
    <div class="right-content">
      <div class="file" v-if="readerShow">
        <FileReader
          :currentFile="currentFile"
          @changeReaderShow="changeReaderShow"
          @changeCopyContent="changeCopyContent"
        />
      </div>
      <div class="right-chat">
        <chat
          ref="chatCp"
          :taskId="taskId"
          :conversationId="conversationId"
          :isReadyForChat="isReadyForChat"
          :copyContent="copyContent"
          :fileMd5List="fileMd5List"
          @changeCopyContent="changeCopyContent"
          @changeAbortController="changeAbortController"
          @changeIsReadyForChat="changeIsReadyForChat"
        ></chat>
      </div>
    </div>
  </div>
  <div class="prompt" v-if="!showDetail">
    <div class="prompt-header">最近打开</div>
    <div class="prompt-table-header">
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
      :dataSource="data"
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
      :list="data"
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
            {{ item.createTime }}
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
    class="prompt-modal"
    :maskClosable="false"
  >
    <div class="prompt-modal-content">
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
  addReadTask,
  batchDelReadTask,
  delReadTask,
  getTaskId,
  getTaskList,
  getTransferFileTree,
  updateReadTask,
} from "@/shared/api/read";
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
import { onMounted, reactive, ref, toRefs, watch } from "vue";
import Chat from "./components/chat";
import FileReader from "./components/fileReader";
import LeftMenu from "./components/leftMenu";

export default {
  name: "Read",
  components: {
    AButton: Button,
    ACheckbox: Checkbox,
    AInput: Input,
    // AMenu: Menu,
    // AMenuItem: Menu.Item,
    AModal: Modal,
    APopover: Popover,
    ASelect: Select,
    //ADivider: Divider,
    Chat,
    ListComponent,
    TableComponent,
    LeftMenu,
    FileReader,
  },
  setup() {
    //----新增任务+查看任务
    const showDetail = ref(false); // 是否展示任务详情
    const changeShowDetail = (value) => {
      showDetail.value = value;
      if (!value) {
        getList(); // 从详情回到任务列表--刷新任务列表
      }
    };

    //新增任务
    const addTask = () => {
      modalTitle.value = "新建任务";
      isModalShow.value = true;
    };

    //----表格列表
    const columns = [
      {
        title: "任务名称",
        dataIndex: "clickName",
        width: 923,
        ellipsis: true,
      },
      {
        title: "最近打开时间",
        dataIndex: "createTime",
        width: 200,
      },
      {
        title: "操作",
        dataIndex: "readAction",
        width: 204,
      },
    ];
    const data = ref([]);
    const tableLoading = ref(false);
    const sort = reactive({
      visible: false,
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

    //数据操作
    const menuList = ref([
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
    ]);

    //获取任务列表
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
      const res = await getTaskList(json);
      tableLoading.value = false;
      if (res.message === "成功") {
        if (res.data) {
          pagination.total = res.data.totalCount;
          data.value =
            (res.data.dateList &&
              res.data.dateList.map((item) => ({
                key: item.id,
                clickName: item.taskName,
                //prompt: item.prompt,
                url: null,
                createTime: item.updateDate || item.createDate,
                id: item.id,
              }))) ||
            [];
        }
      } else {
        message.error(res.message);
      }
    };

    //根据id删除、重命名、查看任务详情
    const currentRecord = ref({});
    const modalTitle = ref(undefined);
    const taskDetailId = ref(undefined); //所要查看任务的id
    //查看任务详情
    const handleTaskDetail = async (record) => {
      const json = {
        id: record.key,
        taskName: record.clickName,
      };
      // const loading = message.loading("正在查看任务详情", 0);
      const res = await updateReadTask(json);
      // loading();
      if (res.message === "成功") {
        const result = await getTaskId();
        if (result.message === "成功") {
          taskId.value = result.data || "";
        } else {
          return message.error(result.message);
        }
        taskDetailId.value = record.key;
        showDetail.value = true;
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

    //移除任务
    const handleDeleteTask = (record) => {
      const title = "是否删除该任务？";
      const content =
        "该操作将删除目标任务，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        const res = await delReadTask(record.id);
        if (res.message === "成功") {
          getList();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };
    //点击表格操作栏
    const handleAction = async (key, record) => {
      switch (key) {
        case "edit":
          modalTitle.value = "重命名任务";
          isModalShow.value = true;
          newName.value = record.clickName;
          currentRecord.value = record;
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

    //重命名任务+新建任务
    const isModalShow = ref(false);
    const newName = ref("");

    //重命名任务
    const reName = async () => {
      if (newName.value.trim() === "") {
        return message.warning("任务名称不可为空！");
      }
      const json = {
        id: currentRecord.value.id,
        taskName: newName.value.trim(),
      };
      const res = await updateReadTask(json);
      if (res.message === "成功") {
        isModalShow.value = false;
        getList();
      } else {
        message.error(res.message);
      }
    };

    // 新建任务
    const createTask = async () => {
      if (newName.value.trim() === "") {
        return message.warning("任务名称不可为空！");
      }
      const json = {
        taskName: newName.value,
      };
      const res = await addReadTask(json);
      if (res.message === "成功") {
        isModalShow.value = false;
        newName.value = null;
        getList();
      } else {
        message.error(res.message);
      }
    };

    // modal确认
    const handleConfirm = async () => {
      switch (modalTitle.value) {
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

    //modal取消
    const handleCancel = () => {
      isModalShow.value = false;
      newName.value = null;
    };

    // 批量删除任务
    const handleBatchDelete = async () => {
      if (!selectedRowKeys.value.length) {
        return message.warning("请选择想要删除的阅读任务！");
      }
      const title = "是否删除任务？";
      const content =
        "该操作将删除所选目标任务，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        const res = await batchDelReadTask(selectedRowKeys.value);
        if (res.message === "成功") {
          selectedRowKeys.value = []; //否则后续继续点击批量删除按钮，保存的仍然是上一次所选中的任务
          getList();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    //------leftMenu资源库导入文件，穿梭框所需数据
    const tData = ref([]);
    // 获取分类树数据
    const getTreeData = async () => {
      const res = await getTransferFileTree();
      if (res.message === "成功") {
        if (res.data && res.data.child && res.data.child.length) {
          const arr = res.data.child.slice(1);
          tData.value = getChildData(arr);
        }
      } else {
        message.error(res.message);
      }
    };

    //在leftMenu资源库导入文件中，a-tree搜索树节点一上来默认不展开，这边希望默认都展开，记录下需要展开节点的key值
    //将包含child的数据解析构成a-cascader需要的结构
    const getChildData = (arr) => {
      const result = [];
      // 遍历 tree
      arr.forEach((item) => {
        // 赋值
        let id = item.id ? item.id : item.category.id;
        let label = item.fileName ? item.fileName : item.category.categoryName;
        let pid = item.categoryId
          ? item.categoryId
          : item.category.parentId == -1
          ? null
          : item.category.parentId;
        let children =
          item.child !== undefined
            ? [...item.child, ...item.files]
            : item.files;
        // 如果有子节点，递归
        if (children && children.length) {
          children = getChildData(children);
        }
        result.push({
          id,
          label,
          pid,
          children,
        });
      });

      return result;
    };

    //----会话相关，记录当前任务id：taskId 和 当前会话的id：conversationId
    const taskId = ref(undefined);
    const conversationId = ref(undefined);
    const isReadyForChat = ref(false); //给chat组件使用，判断对话框是否可以输入问题
    const fileMd5List = ref([]); //会话接口新增参数，所选文件的Md5
    const abortController = ref(null); //已选择文件正在进行对话时，重新选取文件或删除该文件时，需warning：稍后再试

    //修改当前任务id
    const changeTaskId = (value) => {
      taskId.value = value;
    };
    //修改当前会话Id
    const changeConversationId = (value) => {
      conversationId.value = value;
    };
    //修改会话输入框使用状态
    const changeIsReadyForChat = (value) => {
      //对话时，meet.isLoading位置修改，聊天模块点击某一历史记录，将该值初始化为false；阅读时确认选择某一文件时同理
      chatCp.value.changeLoading(false, false);
      isReadyForChat.value = value;
    };

    //修改当前会话的fileMd5List
    const changeFileMd5List = (value) => {
      fileMd5List.value = value;
    };
    //已选择文件进行对话，删除该文件时，需清空当前会话内容
    const changeContent = (value) => {
      chatCp.value.changeMeetContent(value);
    };
    //清空输入框内容
    const changeQuesInput = (value) => {
      chatCp.value.changeQuestinInput(value);
    };
    //修改abortController
    const changeAbortController = (value) => {
      abortController.value = value;
    };

    //-----文件展示区域
    const currentFile = reactive({
      url: "",
      type: "",
      title: "",
    });
    //点击左侧leftMenu时修改当前展示文件
    const changeCurrentFile = (url, type, title) => {
      currentFile.url = url;
      currentFile.type = type;
      currentFile.title = title;
    };

    //阅读器展示或消失状态改变时，保证chat组件滚动条一直在底部
    const chatCp = ref(null);
    const readerShow = ref(false); // 阅读器是否展示
    // 改变阅读器是否展示
    const changeReaderShow = (value) => {
      readerShow.value = value;
    };
    watch(readerShow, () => {
      chatCp.value.changeScroll();
    });

    //选中文本进行提问的内容
    const copyContent = ref(undefined);
    const changeCopyContent = (value) => {
      copyContent.value = value;
    };

    onMounted(async () => {
      getList();
      getTreeData();
    });

    return {
      //----新增任务+查看任务
      showDetail,
      changeShowDetail,
      addTask,

      columns,
      data,
      tableLoading,
      ...toRefs(sort),
      sortConfirm,
      pagination,
      onSelectChange,
      rowSelection,
      selectedRowKeys,
      showType,
      handleChangeShowType,

      menuList,
      getList,
      currentRecord,
      modalTitle,
      taskDetailId,
      handleAction,
      isModalShow,
      newName,
      handleConfirm,
      handleCancel,
      handleTaskDetail,
      handleBatchDelete,
      rowClick,

      tData,

      //会话相关
      taskId,
      conversationId,
      isReadyForChat,
      fileMd5List,
      abortController,
      changeTaskId,
      changeConversationId,
      changeIsReadyForChat,
      changeContent,
      changeQuesInput,
      changeFileMd5List,
      changeAbortController,

      currentFile,
      changeCurrentFile,
      chatCp,
      readerShow,
      changeReaderShow,
      copyContent,
      changeCopyContent,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
