<template>
  <a-modal
    v-model:visible="isShow"
    title="资源库导入文件"
    @ok="confirm"
    @cancel="cancel"
    ok-text="确定"
    cancel-text="取消"
    centered
    width="792px"
    class="resource-modal"
    :maskClosable="false"
  >
    <div class="resource-modal-content">
      <a-transfer
        ref="transferRef"
        v-model:target-keys="targetKeys"
        v-model:selected-keys="selectedKeys"
        class="tree-transfer"
        show-search
        @search="handleSearch"
        :titles="['资源库文件', '目标文件']"
        :data-source="dataSource"
        :render="(item) => item.title"
        :show-select-all="true"
        :list-style="{
          width: '300px',
          height: '350px',
        }"
      >
        <template #children="{ direction, selectedKeys, onItemSelect }">
          <a-directory-tree
            v-if="direction === 'left'"
            block-node
            checkable
            default-expand-all
            checkStrictly
            :checked-keys="[...selectedKeys, ...targetKeys]"
            :tree-data="treeData"
            :expanded-keys="expandedKeys"
            :auto-expand-parent="autoExpandParent"
            @expand="onExpand"
            @check="
              (_, props) => {
                onChecked(
                  props,
                  [...selectedKeys, ...targetKeys],
                  onItemSelect
                );
              }
            "
            @select="
              (_, props) => {
                onChecked(
                  props,
                  [...selectedKeys, ...targetKeys],
                  onItemSelect
                );
              }
            "
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
            <template #title="{ title }">
              <a-tooltip :title="title">
                <span v-if="title.indexOf(searchValue) > -1">
                  {{ title.substr(0, title.indexOf(searchValue)) }}
                  <span style="color: #1776ff">{{ searchValue }}</span>
                  {{
                    title.substr(
                      title.indexOf(searchValue) + searchValue.length
                    )
                  }}
                </span>
                <span v-else>{{ title }}</span>
              </a-tooltip>
            </template>
          </a-directory-tree>
        </template>
        <template #footer="{ direction }">
          <a-button v-if="direction === 'left'" size="small" @click="resetLeft">
            重置
          </a-button>
          <a-button
            v-else-if="direction === 'right'"
            size="small"
            @click="resetRight"
          >
            重置
          </a-button>
        </template>
      </a-transfer>
    </div>
  </a-modal>
</template>

<script>
import { getFileTree } from "@/shared/api/resource";
import { findTreeNodeById } from "@/utils/common";
import {
  Button,
  Modal,
  Tooltip,
  Transfer,
  Tree,
  message,
} from "ant-design-vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";

const { DirectoryTree } = Tree;

export default {
  name: "TransferModal",
  components: {
    AModal: Modal,
    AButton: Button,
    ATransfer: Transfer,
    ADirectoryTree: DirectoryTree,
    ATooltip: Tooltip,
  },
  props: ["isResourceShow"],
  emits: ["changeIsResourceShow", "changeSelectFiles"],
  setup(props, { emit }) {
    const isShow = computed(() => {
      return props.isResourceShow;
    });

    //------leftMenu资源库导入文件，穿梭框所需数据
    const tData = ref([]);
    // 获取分类树数据
    const getTreeData = async () => {
      const res = await getFileTree();
      if (res.message === "成功") {
        if (res.data && res.data.child && res.data.child.length) {
          const arr = res.data.child.slice(1);
          tData.value = getChildData(arr);
          // tData.value = getChildData(res.data.child);
        }
      } else {
        message.error(res.message);
      }
    };

    //将包含child的数据解析构成a-cascader需要的结构
    const getChildData = (arr) => {
      const result = [];
      // 遍历 tree
      arr.forEach((item) => {
        // 赋值
        let key = item.id ? item.id : item.category.id;
        let title = item.fileName ? item.fileName : item.category.categoryName;
        let children =
          item.child !== undefined
            ? [...item.child, ...item.files]
            : item.files;
        // 如果有子节点，递归
        if (children && children.length) {
          expandedKeys.value.push(key); // a-tree搜索树节点一上来默认不展开，这边希望默认都展开，记录下需要展开节点的key值
          children = getChildData(children);
        }
        result.push({
          key,
          title,
          children,
        });
      });
      return result;
    };

    //弹框确认按钮
    const confirm = async () => {
      console.log("资源库导入成功！---", targetKeys.value, tData.value);
      if (!targetKeys.value.length) {
        message.warning("请选择要导入的文件");
        return false;
      }
      const result = [];
      targetKeys.value.map((key) => {
        const node = findTreeNodeById(tData.value, key);
        result.push(node);
      });
      emit("changeSelectFiles", result);
      cancel();
    };

    //弹框取消按钮
    const cancel = () => {
      emit("changeIsResourceShow", false);
      delSearch(0);
      delSearch(1);
      selectedKeys.value = [];
      targetKeys.value = [];
    };

    //穿梭框的相关数据处理
    const transferDataSource = [];
    const flatten = (list = []) => {
      list.forEach((item) => {
        transferDataSource.push(item);
        flatten(item.children);
      });
    };

    const isChecked = (selectedKeys, eventKey) => {
      return selectedKeys.indexOf(eventKey) !== -1;
    };
    const handleTreeData = (treeNodes, targetKeys = []) => {
      return treeNodes.map(({ children, ...item }) => ({
        ...item,
        disabled: targetKeys.includes(item.key),
        children: handleTreeData(children ?? [], targetKeys),
      }));
    };

    const targetKeys = ref([]); //右侧穿梭框内的文件id集合
    const selectedKeys = ref([]); //左侧穿梭框被选中的文件id集合
    const dataSource = ref([]);
    const treeData = computed(() => {
      return handleTreeData(tData.value, targetKeys.value);
    });
    const onChecked = (e, checkedKeys, onItemSelect) => {
      const { eventKey } = e.node; //当前节点
      onItemSelect(eventKey, !isChecked(checkedKeys, eventKey));
    };

    const dataList = ref([]);
    const generateList = (data) => {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.key;
        const title = node.title;
        dataList.value.push({
          key,
          title,
        });
        if (node.children) {
          generateList(node.children);
        }
      }
    };
    generateList(treeData.value);

    //穿梭框：搜索左侧树
    const searchValue = ref(null);
    const handleSearch = (dir, value) => {
      if (dir === "right") return;
      searchValue.value = value;
    };

    //左侧搜索时：树的展开节点
    const expandedKeys = ref([]);
    const autoExpandParent = ref(true);
    const onExpand = (keys) => {
      expandedKeys.value = keys;
      autoExpandParent.value = false;
    };

    watch(searchValue, (value) => {
      //console.log("9999---", dataList.value);
      const expanded = dataList.value
        .map((item) => {
          if (item.title.indexOf(value) > -1) {
            return getParentKey(item.key, treeData.value);
          }
          return null;
        })
        .filter((item, i, self) => item && self.indexOf(item) === i);
      expandedKeys.value = expanded;
      searchValue.value = value;
      autoExpandParent.value = true;
    });

    //获得父亲节点
    const getParentKey = (key, tree) => {
      let parentKey;
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
          if (node.children.some((item) => item.key === key)) {
            parentKey = node.key;
          } else if (getParentKey(key, node.children)) {
            parentKey = getParentKey(key, node.children);
          }
        }
      }
      return parentKey;
    };

    //--穿梭框footer重置按钮
    const transferRef = ref(null); //获取到a-transfer
    //清空穿梭框内部搜索框内容
    const delSearch = async (value) => {
      const transferInstance = transferRef.value;
      await nextTick(); // 等待组件更新重新渲染
      const searchInputElement =
        transferInstance.$el.querySelectorAll(".ant-input")[value];
      searchInputElement.value = null;
      searchInputElement.dispatchEvent(new Event("input", { bubbles: true })); // 触发输入框的 input 事件
    };
    //穿梭框左侧重置
    const resetLeft = async () => {
      selectedKeys.value = [];
      targetKeys.value = [];
      //清空左侧穿梭框的搜索内容
      delSearch(0);
    };

    //穿梭框右侧重置
    const resetRight = async () => {
      targetKeys.value = [];
      //清空右侧穿梭框的搜索内容
      delSearch(1);
    };

    onMounted(async () => {
      await getTreeData();
      flatten(tData.value);
      dataSource.value = transferDataSource;
      console.log("init", dataSource.value, tData.value);
    });

    return {
      isShow,
      //-----左侧文件列
      confirm,
      cancel,

      //-----资源库导入：tree穿梭器
      selectedKeys,
      targetKeys,
      dataSource,
      treeData,
      onChecked,
      handleSearch,
      searchValue,
      expandedKeys,
      autoExpandParent,
      onExpand,

      resetLeft,
      transferRef,
      resetRight,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
