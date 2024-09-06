<template>
  <div class="resource">
    <LeftTree @searchFileList="searchFileList" ref="leftTree" />
    <div class="resource-move-line" @mousedown="onmousedown"></div>
    <div class="resource-right" ref="rightTable">
      <div class="resource-right-header">
        <a-breadcrumb>
          <a-breadcrumb-item
            @click="handleReturn(selectedTreeNode)"
            :style="{
              cursor:
                !selectedTreeNode.name || selectedTreeNode.parentId === '-1'
                  ? 'not-allowed'
                  : 'pointer',
            }"
          >
            <img src="@/assets/images/img/icon-return.svg" alt="" />
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{ selectedTreeNode.name }}</a-breadcrumb-item>
        </a-breadcrumb>
      </div>
      <div class="resource-table-header">
        <div class="header-btns">
          <a-upload
            multiple
            name="file"
            accept=".pdf, .docx, .doc, .xlsx, .csv, .txt"
            class="btn-upload"
            v-if="selectedKeys.length"
            :show-upload-list="false"
            :beforeUpload="beforeUpload"
          >
            <a-button type="primary" class="header-btn">
              <icon-svg icon-class="icon-import" />
              导入文件
            </a-button>
          </a-upload>
          <a-button
            type="primary"
            class="header-btn"
            v-else
            @click="handleClickUpload"
          >
            <icon-svg icon-class="icon-import" />
            导入文件
          </a-button>
          <!-- <a-button
            type="primary"
            class="header-btn"
            @click="handeAddChildFolder"
          >
            <icon-svg icon-class="icon-plus" />
            新建文件夹
          </a-button> -->
        </div>
        <div class="header-actions">
          <div class="header-action" @click="handleBatchDownload('init')">
            <icon-svg icon-class="icon-download" />
          </div>
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
        :dataSource="fileData"
        :columns="columns"
        :loading="tableLoading"
        :pagination="pagination"
        :row-selection="rowSelection"
      >
        <template #statusText="{ text, record }">
          <div
            :class="[
              'status-slot',
              record.status === 1
                ? 'success'
                : record.status === 2
                ? 'fail'
                : record.status === 3
                ? 'ing'
                : 'default',
            ]"
            v-if="text"
          >
            {{ text }}
          </div>
        </template>
        <template #actionsOut="{ record }">
          <a-tooltip title="手动向量化">
            <a
              :class="['table-action', record.status === 2 ? '' : 'disabled']"
              v-if="record.fileSuffix !== 'folder'"
              @click="handleManualVector(record)"
            >
              <icon-svg icon-class="icon-vector" />
            </a>
          </a-tooltip>
          <a-tooltip title="下载">
            <a
              class="table-action"
              @click="handleDownload(record.id, record.name, record.fileSuffix)"
            >
              <download-outlined />
            </a>
          </a-tooltip>
        </template>
        <template #actions="{ record }">
          <a-menu>
            <a-menu-item
              :key="item.key"
              v-for="item in menuList"
              @click="handleMenuClick(item.key, record)"
              :disabled="record.status === 3 && item.key === 'delete'"
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
        :list="fileData"
        :loading="tableLoading"
        :pagination="pagination"
        @onSelectChange="onSelectChange"
      >
        <template #listItem="{ item }">
          <div :class="['item-top', item.fileSuffix]">
            <div class="item-top-header">
              <img :src="item.url" alt="" />
              <span class="header-name" :title="item.name">{{
                item.name
              }}</span>
              <a-checkbox :checked="selectedRowKeys.indexOf(item.id) > -1" />
            </div>
            <div class="item-top-middle">
              <div class="item-top-middle-left">
                <img src="@/assets/images/img/icon-box.svg" alt="" />
                {{ item.size }}
              </div>
              <div
                :class="[
                  'item-top-middle-right',
                  item.status === 1
                    ? 'success'
                    : item.status === 2
                    ? 'fail'
                    : item.status === 3
                    ? 'ing'
                    : 'default',
                ]"
                v-if="item.statusText"
              >
                {{ item.statusText }}
              </div>
            </div>
            <div class="item-top-bottom">
              <img src="@/assets/images/img/icon-time.svg" alt="" />
              {{ item.createTime }}
            </div>
          </div>
          <div class="item-footer">
            <a-tooltip title="手动向量化">
              <a
                :class="[
                  'item-footer-icon',
                  item.status === 2 ? '' : 'disabled',
                ]"
                v-if="item.fileSuffix !== 'folder'"
                @click.stop="handleManualVector(item)"
              >
                <icon-svg icon-class="icon-vector" />
              </a>
            </a-tooltip>
            <a-tooltip title="下载">
              <a
                class="item-footer-icon"
                @click.stop="
                  handleDownload(item.id, item.name, item.fileSuffix)
                "
              >
                <download-outlined />
              </a>
            </a-tooltip>
            <a-dropdown overlayClassName="table-actions">
              <a class="ant-dropdown-link item-footer-icon" @click.prevent>
                <ellipsis-outlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    :key="menu.key"
                    v-for="menu in menuList"
                    @click="handleMenuClick(menu.key, item)"
                    :disabled="item.status === 3 && menu.key === 'delete'"
                  >
                    <icon-svg :icon-class="`icon-${menu.key}`" />{{
                      menu.title
                    }}</a-menu-item
                  >
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>
      </ListComponent>
    </div>
  </div>
  <a-modal
    v-model:visible="isModalShow"
    title="重命名"
    @ok="handleRenameFile"
    centered
    width="378px"
    class="rename-modal"
  >
    <div class="rename-modal-content">
      <a-input
        v-model:value.trim="newName"
        placeholder="请输入"
        @pressEnter="handleRenameFile"
      />
    </div>
  </a-modal>
  <a-modal
    v-model:visible="isMoveModalShow"
    title="移动文件（夹）"
    @ok="handleMoveFile"
    centered
    width="378px"
    class="move-modal"
  >
    <div class="move-modal-content">
      <p class="content-title">请选择目标文件夹</p>
      <a-select
        placeholder="请选择"
        :options="selectableFolders"
        v-model:value="targetFolder"
      />
    </div>
  </a-modal>
</template>

<script>
import ListComponent from "@/components/listComponent";
import TableComponent from "@/components/tableComponent";
import {
  batchDelete,
  deleteFile,
  downloadFolder,
  downloadRes,
  editFile,
  getFileList,
  manualVector,
  uploadFile,
} from "@/shared/api/resource";
import { downloadFile, findTreeNodeById, modalConfirm } from "@/utils/common";
import {
  Breadcrumb,
  Button,
  Checkbox,
  Dropdown,
  Input,
  Menu,
  Modal,
  Popover,
  Select,
  Tooltip,
  Upload,
  message,
} from "ant-design-vue";
import JSZip from "jszip";
import { find } from "lodash";
import { computed, onBeforeUnmount, reactive, ref, toRefs } from "vue";
import LeftTree from "./components/leftTree";

const { Item } = Breadcrumb;

// 前端状态：1-收录成功；2-收录失败；3-正在收录，4-待收录
// 后端状态：1-待收录；2-正在收录；3-收录成功，4-收录失败
const statusObj = {
  1: 4,
  2: 3,
  3: 1,
  4: 2,
};
const statusTextObj = {
  1: "待收录",
  2: "正在收录",
  3: "收录成功",
  4: "收录失败",
};

export default {
  name: "Resource",
  components: {
    AButton: Button,
    ABreadcrumb: Breadcrumb,
    ABreadcrumbItem: Item,
    ACheckbox: Checkbox,
    ADropdown: Dropdown,
    AInput: Input,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    AModal: Modal,
    APopover: Popover,
    ASelect: Select,
    ATooltip: Tooltip,
    AUpload: Upload,
    LeftTree,
    ListComponent,
    TableComponent,
  },
  setup() {
    const leftTree = ref(null); // leftTree组件实例对象
    const fileData = ref([]); // 文件列表数据
    const tableLoading = ref(false); // 列表是否正在加载

    // leftTree子组件相关信息
    // 获取leftTree组件的treeData
    const treeData = computed(() => {
      if (leftTree.value) {
        return leftTree.value.treeData;
      } else {
        return [];
      }
    });
    // 获取leftTree组件的selectedKeys
    const selectedKeys = computed(() => {
      if (leftTree.value) {
        return leftTree.value.selectedKeys;
      } else {
        return [];
      }
    });
    // 被选中的数节点
    const selectedTreeNode = computed(
      () => findTreeNodeById(treeData.value, selectedKeys.value[0]) || {}
    );
    const targetFolder = ref(undefined);
    const selectableFolders = computed(() => {
      if (leftTree.value) {
        return leftTree.value.selectableFolders;
      } else {
        return [];
      }
    });

    const columns = [
      {
        title: "文件名称",
        dataIndex: "name",
        width: 459,
      },
      {
        title: "知识库收录状态",
        dataIndex: "statusText",
        width: 160,
      },
      {
        title: "大小",
        dataIndex: "size",
        width: 120,
      },
      {
        title: "创建时间",
        dataIndex: "createTime",
        width: 200,
      },
      {
        title: "操作",
        dataIndex: "action",
        width: 90,
        fixed: "right",
      },
    ];
    const sort = reactive({
      visible: false,
      sortColumns: [
        {
          value: "status",
          label: "知识库收录状态",
        },
        {
          value: "size",
          label: "大小",
        },
        {
          value: "update_date",
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
      if (!sort.sortColumn && sort.sortValue) {
        return message.warning("请选择想要排序的列！");
      }
      if (!sort.sortValue && sort.sortColumn) {
        return message.warning("请选择排序方式！");
      }
      sort.visible = false;
      searchFileList();
    };
    const pagination = reactive({
      size: "small",
      total: 0,
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
        searchFileList();
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
        key: "move",
        title: "移动",
      },
      {
        key: "delete",
        title: "删除",
      },
    ]);
    const isModalShow = ref(false);
    const isMoveModalShow = ref(false);
    const newName = ref(""); // 重命名的新名字
    let targetFile = reactive({}); // 正在被编辑的文件

    // 表格操作菜单
    const handleMenuClick = (key, record) => {
      if (record.status === 3 && key === "delete") return;
      targetFile = record;
      let parent = [];
      switch (key) {
        case "edit":
          isModalShow.value = true;
          newName.value = record.name;
          break;
        case "move":
          parent = findTreeNodeById(treeData.value, record.categoryId);
          if (record.fileSuffix === "folder") {
            // 文件夹
            leftTree.value.editNode.data = find(
              parent.children,
              (v) => v.name === record.name
            );
          } else {
            // 文件
            leftTree.value.editNode.data = {
              children: [],
              isEdit: false,
              key: record.key,
              name: record.name,
              title: record.name,
              parentId: record.categoryId,
            };
          }
          isMoveModalShow.value = true;
          break;
        case "delete":
          handleDeleteFile(record);
          break;
      }
    };

    // 重命名文件（夹）
    const handleRenameFile = async () => {
      if (newName.value.trim() === "") {
        return message.warning("名称不可为空！");
      }
      const json = {
        id: targetFile.id,
        categoryId: targetFile.categoryId,
        newFileName: newName.value.trim(),
      };
      // const loading = message.loading("正在操作", 0);
      const res = await editFile(json);
      // loading();
      if (res.message === "成功") {
        // message.success("修改成功！");
        searchFileList();
        leftTree.value.getTreeData();
        isModalShow.value = false;
      } else {
        message.error(res.message);
      }
    };

    // 移动文件（夹）
    const handleMoveFile = async () => {
      if (!targetFolder.value) {
        message.warning("请选择目标文件夹");
        return false;
      }
      const json = {
        id: targetFile.id,
        categoryId: targetFolder.value,
        newFileName: targetFile.name,
      };
      // const loading = message.loading("正在操作", 0);
      const res = await editFile(json);
      // loading();
      if (res.message === "成功") {
        // message.success("移动成功！");
        searchFileList();
        leftTree.value.getTreeData();
        isMoveModalShow.value = false;
      } else {
        message.error(res.message);
      }
    };

    // 删除文件（夹）
    const handleDeleteFile = (record) => {
      const title = "是否确认删除该文件（夹）？";
      const content =
        "该操作将删除所有目标文件，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        // const loading = message.loading("正在操作", 0);
        const res = await deleteFile(record.id);
        // loading();
        if (res.message === "成功") {
          // message.success("删除成功！");
          searchFileList();
          leftTree.value.getTreeData();
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    // 搜索列表
    const searchFileList = async () => {
      const json = {
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
        categoryId: selectedKeys.value[0],
        sortCol: sort.sortColumn,
        sortRule: sort.sortValue === "no" ? undefined : sort.sortValue,
      };
      tableLoading.value = true;
      const res = await getFileList(json);
      tableLoading.value = false;
      let result = [];
      if (res.message === "成功") {
        if (res.data) {
          pagination.total = res.data.totalCount;
          result =
            (res.data.dateList &&
              res.data.dateList.map((item) => {
                let suffix = item.fileSuffix;
                suffix = suffix ? suffix.toLowerCase() : "";
                let fileSuffix = null;
                switch (suffix) {
                  case "mp3":
                  case "wma":
                  case "aac":
                  case "ogg ":
                  case "mpc":
                  case "flac":
                  case "wv":
                  case "ape":
                  case "tta":
                  case "tak":
                  case "shorten":
                  case "optimfrog":
                  case "kgm":
                  case "ncm":
                  case "mflac":
                    fileSuffix = "audio";
                    break;
                  case "html":
                  case "htm":
                  case "xml":
                  case "js":
                  case "jsx":
                  case "vue":
                  case "ts":
                  case "tsx":
                  case "py":
                  case "pyc":
                  case "exe":
                  case "dll":
                  case "h":
                  case "c":
                  case "hpp":
                  case "hxx":
                  case "cpp":
                  case "cc":
                  case "cxx":
                  case "c++":
                  case "i":
                  case "ii":
                  case "m":
                  case "o":
                  case "s":
                  case "cs":
                  case "java":
                  case "php":
                  case "kt":
                    fileSuffix = "code";
                    break;
                  case "mdb":
                  case "mdf":
                  case "myd":
                  case "db":
                  case "dbf":
                  case "wdb":
                    fileSuffix = "database";
                    break;
                  case "doc":
                  case "docx":
                    fileSuffix = "doc";
                    break;
                  case "xlsx":
                  case "xls":
                  case "xlsb":
                  case "xlsm":
                  case "csv":
                    fileSuffix = "excel";
                    break;
                  case "":
                    fileSuffix = "folder";
                    break;
                  case "pdf":
                    fileSuffix = "pdf";
                    break;
                  case "bmp":
                  case "jpeg":
                  case "jpg":
                  case "png":
                  case "tiff":
                  case "gif":
                  case "pcx":
                  case "svg":
                  case "psd":
                    fileSuffix = "picture";
                    break;
                  case "txt":
                    fileSuffix = "text";
                    break;
                  case "mp4":
                  case "mov":
                  case "avi":
                  case "flv":
                  case "rmvb":
                  case "mkv":
                    fileSuffix = "video";
                    break;

                  default:
                    fileSuffix = "unknow";
                    break;
                }
                return {
                  id: item.id,
                  key: item.id,
                  name: item.fileName,
                  categoryId: item.categoryId,
                  status: statusObj[item.status],
                  statusText:
                    fileSuffix === "folder" ? "" : statusTextObj[item.status],
                  size: item.size || item.size === 0 ? item.size + "M" : null,
                  createTime: item.updateDate || item.createDate,
                  url: require(`@/assets/images/img/file-${fileSuffix}.svg`),
                  fileSuffix,
                };
              })) ||
            [];
        }
      } else {
        message.error(res.message);
      }
      selectedRowKeys.value = []; // 重置选中行
      fileData.value = result;
    };

    // 上传文件
    const beforeUpload = async (file) => {
      // const fileType = file.name.split(".")[1];
      const fileType = file.name.split(".").pop();
      if (
        fileType !== "doc" &&
        fileType !== "docx" &&
        fileType !== "pdf" &&
        fileType !== "xlsx" &&
        fileType !== "csv" &&
        fileType !== "txt"
      ) {
        message.info(
          "当前只支持上传doc、docx、pdf、xlsx、xls、csv类型的文件！",
          3
        );
        return false;
      }
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("categoryId", selectedKeys.value[0]);
        const loading = message.loading("正在上传", 0);
        const res = await uploadFile(formData);
        loading();
        if (res.message === "成功") {
          // message.success("上传成功");
          searchFileList();
        } else {
          message.error(res.message);
        }
      }
      return false; // 阻止默认访问当前ip下的某个路径的行为
    };

    // 下载文件（夹）
    const handleDownload = async (id, name, type) => {
      downloadRes(id).then((res) => {
        if (type === "folder") {
          handleDownloadFolder([id], `${name}.zip`);
        } else {
          downloadFile(res, name);
        }
      });
    };

    let downloadFiles = []; // 待下载的文件集合
    // 批量下载文件
    const handleBatchDownload = async (type) => {
      if (type === "init") {
        downloadFiles = [];
      }
      const folderIds = []; // 文件夹id集合
      selectedRowKeys.value.map((key) => {
        const file = find(fileData.value, (f) => f.id === key);
        if (file.fileSuffix === "folder") {
          // 文件夹
          folderIds.push(key);
        } else {
          downloadFiles.push(file);
        }
      });
      handleDownloadFolder(folderIds);
    };

    // 下载文件夹
    const handleDownloadFolder = async (ids, name) => {
      if (ids.length) {
        const res = await downloadFolder(ids);
        if (res.message === "成功") {
          downloadFiles = [
            ...downloadFiles,
            ...res.data.map((f) => ({
              ...f,
              name: f.fileName,
            })),
          ];
        } else {
          message.error(res.message);
        }
      }
      const zip = new JSZip();
      const folder = zip.folder("download");
      const promises = downloadFiles.map((file) => {
        return downloadRes(file.id).then((f) => {
          // 将文件添加到zip文件夹中
          folder.file(file.name, f, { binary: true });
        });
      });
      Promise.all(promises).then(() => {
        zip.generateAsync({ type: "blob" }).then((content) => {
          const date = new Date();
          const dateString =
            name ||
            `${date.getFullYear()}${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}${date
              .getDate()
              .toString()
              .padStart(2, "0")}${date
              .getHours()
              .toString()
              .padStart(2, "0")}${date
              .getMinutes()
              .toString()
              .padStart(2, "0")}${date
              .getSeconds()
              .toString()
              .padStart(2, "0")}.zip`;
          downloadFile(content, dateString); // 下载
        });
      });
    };

    // 手动向量化
    const handleManualVector = async (record) => {
      if (record.status !== 2) return;
      const res = await manualVector(record.id);
      if (res.message === "成功") {
        searchFileList();
      } else {
        message.error(res.message);
      }
    };

    // 点击导入按钮
    const handleClickUpload = () => {
      message.info("请先选择左侧文件夹");
    };

    // 新建文件夹按钮方法
    const handeAddChildFolder = () => {
      leftTree.value.onContextMenuClick(selectedKeys.value[0], "child");
    };

    // 面包屑返回上一层方法
    const handleReturn = (node) => {
      if (node.parentId === -1) return;
      leftTree.value.onSelect([node.parentId]);
    };

    // 批量删除文件
    const handleBatchDelete = async () => {
      if (!selectedRowKeys.value.length) {
        return message.warning("请选择想要删除的资源！");
      } else {
        const title = "是否确认删除所有选中文件（夹）？";
        const content =
          "该操作将删除所有目标文件，该操作不可撤回，请确认是否继续删除？";
        const onOk = async () => {
          const json = {
            ids: selectedRowKeys.value,
          };
          // const loading = message.loading("正在删除", 0);
          const res = await batchDelete(json);
          // loading();
          if (res.message === "成功") {
            // message.success("删除成功！");
            selectedRowKeys.value = []; //否则后续继续点击批量删除按钮，保存的仍然是上一次所选中的文件
            searchFileList();
            leftTree.value.getTreeData();
          } else {
            message.error(res.message);
          }
        };
        modalConfirm(title, content, onOk);
      }
    };

    // 拖拽
    let ismousedown = false; // 是否正在拖拽
    let mouseDownX = null;
    const rightTable = ref(null);
    let treeWidth = null;
    let tableWidth = null;
    const onmousedown = (e) => {
      ismousedown = true;
      mouseDownX = e.pageX;
      // 记录此时树状区域和表格区域的宽度
      treeWidth = leftTree.value.$el.nextSibling.offsetWidth;
      tableWidth = rightTable.value.offsetWidth;
      document.body.onselectstart = () => false; // 防止页面元素出现被选中的蓝色状态
      window.addEventListener("mousemove", handleMove, false);
      window.addEventListener("mouseup", moveUp, false);
    };

    const handleMove = (e) => {
      if (!ismousedown) return;
      const deltaX = mouseDownX - e.pageX;
      treeWidth -= deltaX;
      tableWidth += deltaX;
      mouseDownX = e.pageX;
      if (tableWidth <= 720 || treeWidth <= 288) return;
      leftTree.value.$el.nextSibling.style.width = treeWidth + "px";
      rightTable.value.style.width = tableWidth + "px";
    };
    const moveUp = (e) => {
      document.body.onselectstart = () => true;
      ismousedown = false;
      window.removeEventListener("mousemove", handleMove, false);
    };

    onBeforeUnmount(() => {
      window.removeEventListener("mouseup", moveUp, true);
      window.removeEventListener("mousemove", handleMove, true);
    });

    return {
      leftTree,
      rightTable,
      fileData,
      columns,
      pagination,
      rowSelection,
      showType,
      menuList,
      newName,
      ...toRefs(sort),
      isModalShow,
      isMoveModalShow,
      tableLoading,
      selectedKeys,
      targetFolder,
      selectedTreeNode,
      selectedRowKeys,

      beforeUpload,
      handleReturn,
      onSelectChange,
      handleMenuClick,
      searchFileList,
      handleRenameFile,
      handleBatchDelete,
      handleClickUpload,
      handleMoveFile,
      selectableFolders,
      handeAddChildFolder,
      handleChangeShowType,
      onmousedown,
      sortConfirm,
      handleDownload,
      handleManualVector,
      handleBatchDownload,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
