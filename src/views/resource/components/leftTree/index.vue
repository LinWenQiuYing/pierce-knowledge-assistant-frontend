<template>
  <div class="left-tree">
    <div class="left-tree-title">
      <span class="title-text">我的资源库</span>
      <a-button class="title-btn" @click="handleAddFolder">新建文件夹</a-button>
    </div>
    <div class="left-tree-content">
      <a-spin v-if="treeLoading" class="content-loading" />
      <a-directory-tree
        v-else
        class="content-tree"
        v-model:expandedKeys="expandedKeys"
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        @expand="onExpand"
        @select="onSelect"
      >
        <template #icon="{ key }">
          <img
            alt=""
            v-if="expandedKeys.includes(key)"
            class="folder-icon"
            src="@/assets/images/img/folder-open.svg"
          />
          <img
            alt=""
            v-else
            class="folder-icon"
            src="@/assets/images/img/folder-close.svg"
          />
        </template>
        <template #title="{ key: treeKey, title }">
          <div v-if="findTreeNode(treeData, treeKey).isEdit" class="tree-title">
            <a-input
              ref="newTreeNode"
              type="text"
              :value="title"
              class="tree-title-input"
              @change="(e) => onInputChange(e, treeKey)"
              @pressEnter="addConfirm(treeKey)"
            />
            <div class="tree-title-btns">
              <close-circle-outlined @click.stop="addCancel(treeKey)" />
              <check-circle-outlined @click.stop="addConfirm(treeKey)" />
            </div>
          </div>
          <div v-else class="tree-title">
            <span>{{ title }}</span>
            <a-dropdown :trigger="['click']">
              <ellipsis-outlined @click.stop />
              <template #overlay>
                <a-menu
                  @click="
                    ({ key: menuKey }) => onContextMenuClick(treeKey, menuKey)
                  "
                >
                  <a-menu-item :key="item.key" v-for="item in menuList">{{
                    item.title
                  }}</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>
      </a-directory-tree>
    </div>
  </div>
  <a-modal
    v-model:visible="isModalShow"
    title="移动文件（夹）"
    @ok="handleMove"
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
import {
  createFolder,
  deleteFolder,
  editFolder,
  getFileTree,
  moveFolder,
} from "@/shared/api/resource";
import { findTreeNodeById, modalConfirm } from "@/utils/common";
import {
  Button,
  Dropdown,
  Input,
  Menu,
  Modal,
  Select,
  Spin,
  Tree,
  message,
} from "ant-design-vue";
import { find, findIndex } from "lodash";
import { nanoid } from "nanoid";
import { computed, onMounted, reactive, ref } from "vue";

const { DirectoryTree } = Tree;
const { Item } = Menu;

export default {
  name: "LeftTree",
  components: {
    AButton: Button,
    ADirectoryTree: DirectoryTree,
    ADropdown: Dropdown,
    AInput: Input,
    AMenu: Menu,
    AMenuItem: Item,
    AModal: Modal,
    ASelect: Select,
    ASpin: Spin,
  },
  emits: ["searchFileList"],
  setup(props, { emit }) {
    const treeData = ref([]); // 分类树数据
    const allFolders = ref([]); // 所有文件夹集合
    const treeLoading = ref(false); // 分类树是否加载
    const expandedKeys = ref([]); // 展开的节点
    const selectedKeys = ref([]); // 选择的节点
    const targetFolder = ref(undefined); // 移动到目标文件夹的id
    const isModalShow = ref(false); // 移动文件（夹）弹窗是否展示
    const actionType = ref(""); // 添加子文件夹还是根文件夹 child | root
    const newTreeNode = ref(null); // 新增文件夹节点对应的input输入框组件
    let editNode = reactive({
      data: {},
    }); // 正在编辑的节点--包裹一层，不然直接赋值会丢失响应式
    const menuList = ref([
      {
        key: "child",
        title: "新建子文件夹",
      },
      {
        key: "rename",
        title: "重命名",
      },
      {
        key: "move",
        title: "移动文件夹",
      },
      {
        key: "delete",
        title: "删除",
      },
    ]); // 分类树菜单
    const selectedMenuKey = ref(null); // 选中的菜单

    const getChildrenFolders = (arr, result) => {
      arr.map((item) => {
        result.push(item.key);
        result = getChildrenFolders(item.children, result);
      });
      return result;
    };

    // 移动文件夹时可选的文件夹集合——需要排除：当前文件夹、当前文件夹的父文件夹、后代文件夹
    const selectableFolders = computed(() => {
      let result = [];
      // 获取 当前文件夹、当前文件夹的父文件夹、后代文件夹的id集合
      const childrenFolders = getChildrenFolders(editNode.data.children, [
        editNode.data.key,
        editNode.data.parentId,
      ]);
      // 在allFolders中取个差集
      result = allFolders.value.filter(
        (v) => findIndex(childrenFolders, (i) => i === v.value) === -1
      );
      return result;
    });

    // 返回对应id的分类树节点对象
    const findTreeNode = (nodeList, id) => {
      return findTreeNodeById(nodeList, id);
    };

    // 分类树展开事件
    const onExpand = (keys) => {
      expandedKeys.value = keys;
    };

    // 分类树选择事件
    const onSelect = (keys) => {
      const node = findTreeNode(treeData.value, keys[0]);
      if (!node || node.isEdit) return;
      selectedKeys.value = keys;
      emit("searchFileList");
    };

    // 新建一级文件夹
    const handleAddFolder = () => {
      actionType.value = "root";
      treeData.value.push({
        key: nanoid(),
        title: "",
        name: "",
        parentId: -1,
        children: [],
        isEdit: true,
      });
    };

    // 新建文件夹或者重命名文件夹input的输入事件
    const onInputChange = (e, treeKey) => {
      const node = findTreeNode(treeData.value, treeKey);
      node.title = e.target.value;
    };

    // 新建文件夹或者重命名文件夹的确定事件
    const addConfirm = async (key) => {
      let res = null;
      // let text = "";
      let target = null;
      if (actionType.value === "child") {
        if (selectedMenuKey.value === "child") {
          target = find(editNode.data.children, (item) => item.key === key);
          // text = "创建成功!";
        } else {
          target = editNode.data;
          // text = "修改成功!";
        }
      } else {
        target = find(treeData.value, (item) => item.key === key);
        // text = "创建成功!";
      }
      // 判断文件夹名称的长度大小
      if (target.title.trim().length < 3 || target.title.trim().length > 63) {
        return message.warning(
          "文件夹名称长度必选大于等于3个字符，小于等于63个字符！"
        );
      }
      if (actionType.value === "child") {
        if (selectedMenuKey.value === "child") {
          res = await createFolder(editNode.data.key, target.title.trim());
        } else {
          res = await editFolder(editNode.data.key, editNode.data.title.trim());
        }
      } else {
        res = await createFolder(-1, target.title.trim());
      }
      if (res.message === "成功") {
        // message.success(text);
        getTreeData();
      } else {
        message.error(res.message);
      }
    };

    // 新建文件夹或者重命名文件夹的取消事件
    const addCancel = (key) => {
      if (actionType.value === "child") {
        if (selectedMenuKey.value === "child") {
          editNode.data.children = editNode.data.children.filter(
            (item) => item.key !== key
          );
        } else {
          editNode.data.isEdit = false;
          editNode.data.title = editNode.data.name;
        }
      } else {
        const index = findIndex(treeData.value, (item) => item.key === key);
        treeData.value.splice(index, 1);
      }
    };

    // 获取分类树数据
    const getTreeData = async () => {
      treeLoading.value = true;
      const res = await getFileTree();
      treeLoading.value = false;
      treeData.value = [];
      if (res.message === "成功") {
        if (res.data && res.data.child && res.data.child.length) {
          allFolders.value = [];
          const arr = res.data.child.slice(1);
          treeData.value = getChildData(arr);
        }
      } else {
        message.error(res.message);
      }
    };

    // 递归遍历返回分类树的数据
    const getChildData = (arr) => {
      const result = [];
      arr.map((item) => {
        let children = [];
        allFolders.value.push({
          value: item.category.id,
          label: item.category.categoryName,
        });
        if (item.child && item.child.length) {
          children = getChildData(item.child);
        }
        result.push({
          title: item.category.categoryName,
          name: item.category.categoryName, // 重命名-取消时用
          key: item.category.id,
          parentId: item.category.parentId,
          children,
          isEdit: false,
        });
      });
      return result;
    };

    // 点击分类树的菜单
    const onContextMenuClick = async (treeKey, menuKey) => {
      editNode.data = findTreeNode(treeData.value, treeKey);
      console.log("onContextMenuClick", editNode.data);
      selectedMenuKey.value = menuKey;
      actionType.value = "child";
      switch (menuKey) {
        case "child":
          editNode.data.children = [
            ...editNode.data.children,
            {
              key: nanoid(),
              title: "",
              name: "",
              parentId: treeKey,
              children: [],
              isEdit: true,
            },
          ];
          if (!expandedKeys.value.includes(treeKey)) {
            expandedKeys.value = [...expandedKeys.value, treeKey];
          }
          setTimeout(() => {
            newTreeNode.value.focus();
          }, 400);
          break;
        case "rename":
          if (editNode.data.parentId === "-1") {
            message.info("根目录暂不支持重命名功能！");
          } else {
            editNode.data.isEdit = true;
          }
          break;
        case "move":
          if (editNode.data.parentId === "-1") {
            message.info("根目录暂不支持移动功能！");
          } else {
            isModalShow.value = true;
          }
          break;
        case "delete":
          handleDeleteFolder();
          break;

        default:
          break;
      }
    };

    // 移动文件夹
    const handleMove = async () => {
      if (!targetFolder.value) {
        message.warning("请选择目标文件夹");
        return false;
      }
      const res = await moveFolder(editNode.data.key, targetFolder.value);
      if (res.message === "成功") {
        // message.success("移动成功！");
        isModalShow.value = false;
        getTreeData();
        emit("searchFileList");
      } else {
        message.error(res.message);
      }
    };

    // 删除文件夹
    const handleDeleteFolder = () => {
      const title = "是否确认删除该文件夹？";
      const content =
        "该操作将删除所有目标文件，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        const res = await deleteFolder(editNode.data.key);
        if (res.message === "成功") {
          // message.success("删除成功！");
          const index = findIndex(
            selectedKeys.value,
            (v) => v === editNode.data.key
          );
          if (index > -1) {
            selectedKeys.value.splice(index, 1);
          }
          getTreeData();
          emit("searchFileList");
        } else {
          message.error(res.message);
        }
      };
      modalConfirm(title, content, onOk);
    };

    onMounted(() => {
      getTreeData();
    });

    return {
      treeData,
      menuList,
      editNode,
      isModalShow,
      treeLoading,
      newTreeNode,
      expandedKeys,
      selectedKeys,
      targetFolder,
      selectableFolders,

      onExpand,
      onSelect,
      addCancel,
      addConfirm,
      handleMove,
      getTreeData,
      findTreeNode,
      onInputChange,
      handleAddFolder,
      handleDeleteFolder,
      onContextMenuClick,
    };
  },
};
</script>
<style lang="less" scoped>
@import url("./index.less");
</style>
