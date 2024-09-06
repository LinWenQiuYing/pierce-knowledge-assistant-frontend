<template>
  <el-dialog
    v-model="dialogVisible"
    title="资源库导入文件"
    width="800px"
    class="dialog-modal"
    :close-on-click-modal="false"
  >
    <div class="transfer-tree-box">
      <!-- 左侧待选内容 -->
      <div class="select-box">
        <div class="box-title">
          <div class="box-title-left">资源库文件</div>
          <div class="box-title-right" @click="clickAllSelectLeft">全选</div>
        </div>
        <div class="box-content">
          <el-input
            v-model="leftFilterText"
            placeholder="请输入搜索关键字"
            class="box-input"
            :suffix-icon="Search"
            clearable
          />
          <div class="box-center">
            <el-tree
              ref="leftTree"
              :data="params.leftData"
              :props="params.defaultProps"
              show-checkbox
              node-key="id"
              default-expand-all
              :filter-node-method="filterNode"
            >
              <template #default="{ node }">
                <span>
                  <span
                    v-if="acceptFileType.includes(node.label.split('.').pop())"
                  >
                    <img
                      alt=""
                      class="folder-icon"
                      src="@/assets/images/img/file.svg"
                    />
                  </span>
                  <span v-else>
                    <img
                      alt=""
                      v-if="node.expanded"
                      class="folder-icon"
                      src="@/assets/images/img/folder-open.svg"
                    />
                    <img
                      alt=""
                      v-else
                      class="folder-icon"
                      src="@/assets/images/img/folder-close.svg"
                    />
                  </span>
                  <span>{{ node.label }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
        <div class="box-bottom">
          <el-button @click="resetLeft" class="bottom-btn">重置</el-button>
        </div>
      </div>

      <!-- 中间穿梭按钮 -->
      <div class="transfer-btn">
        <div class="pick-btn" @click="towardsRight">&gt;</div>
        <div class="pick-btn" @click="towardsLeft">&lt;</div>
      </div>

      <!-- 右侧已选内容 -->
      <div class="select-box">
        <div class="box-title">
          <div class="box-title-left">目标文件</div>
          <div class="box-title-right" @click="clickAllSelectRight">全选</div>
        </div>
        <div class="box-content">
          <el-input
            v-model="rightFilterText"
            placeholder="请输入搜索关键字"
            class="box-input"
            :suffix-icon="Search"
            clearable
          />
          <div class="box-center">
            <el-tree
              ref="rightTree"
              :data="params.rightData"
              :props="params.defaultProps"
              show-checkbox
              node-key="id"
              default-expand-all
              :filter-node-method="filterNode"
            >
              <template #default="{ node }">
                <span>
                  <span
                    v-if="acceptFileType.includes(node.label.split('.').pop())"
                  >
                    <img
                      alt=""
                      class="folder-icon"
                      src="@/assets/images/img/file.svg"
                    />
                  </span>
                  <span v-else>
                    <img
                      alt=""
                      v-if="node.expanded"
                      class="folder-icon"
                      src="@/assets/images/img/folder-open.svg"
                    />
                    <img
                      alt=""
                      v-else
                      class="folder-icon"
                      src="@/assets/images/img/folder-close.svg"
                    />
                  </span>

                  <span>{{ node.label }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
        <div class="box-bottom">
          <el-button @click="resetRight" class="bottom-btn">重置</el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="handleConfirm" class="confirm-btn">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { Folder, FolderOpened, Search } from "@element-plus/icons-vue";
// import { ElButton, ElDialog, ElInput, ElTree } from "element-plus";
import { computed, onMounted, reactive, ref, watch } from "vue";
export default {
  name: "TreeTransfer",
  // components: {
  //   ElButton,
  //   ElTree,
  //   ElInput,
  //   ElDialog,
  // },
  props: ["treeData", "isResourceShow", "choosedFileId"],
  emits: ["changeIsResourceShow", "confirmTransfer"],
  // layout: "login",
  setup(props, { emit }) {
    //弹框是否展示
    const dialogVisible = computed(() => {
      return props.isResourceShow;
    });

    //资源库文件所有可能的样式
    const acceptFileType = ref(["pdf", "docx", "doc", "xlsx", "csv", "txt"]);

    const params = reactive({
      defaultProps: {
        children: "children",
        label: "label",
      },
      leftData: [],
      rightData: [],
    });

    const leftTree = ref(null);
    const rightTree = ref(null);

    // 点击向右穿梭
    const towardsRight = () => {
      // (leafOnly, includeHalfChecked) 接收两个 boolean 类型的参数，
      // 1. 是否只是叶子节点，默认值为 false 2. 是否包含半选节点，默认值为 false
      const checkedNodes = leftTree.value.getCheckedNodes(false, true); // 包含半选
      const checkedKeys = leftTree.value.getCheckedKeys(false);
      // console.log("向右穿梭99999999999", checkedNodes, checkedKeys);

      const copyNodes = JSON.parse(JSON.stringify(checkedNodes));
      copyNodes.forEach((x) => {
        x.children = [];
        if (!rightTree.value.getNode(x.id)) {
          rightTree.value.append(x, x.pid);
        }
      });

      checkedKeys.forEach((x) => {
        leftTree.value.remove(x);
      });
      afterToward();
      leftFilterText.value = "";
      rightFilterText.value = "";
    };

    // 点击向左穿梭
    const towardsLeft = () => {
      const checkedNodes = rightTree.value.getCheckedNodes(false, true); // 包含半选
      const checkedKeys = rightTree.value.getCheckedKeys(false);

      const copyNodes = JSON.parse(JSON.stringify(checkedNodes));
      copyNodes.forEach((x) => {
        x.children = [];
        if (!leftTree.value.getNode(x.id)) {
          leftTree.value.append(x, x.pid);
        }
      });

      checkedKeys.forEach((x) => {
        rightTree.value.remove(x);
      });

      afterToward();
      leftFilterText.value = "";
      rightFilterText.value = "";
    };

    // 点击全选左侧
    const clickAllSelectLeft = () => {
      leftTree.value.setCheckedNodes(params.leftData);
    };

    // 点击全选右侧
    const clickAllSelectRight = () => {
      rightTree.value.setCheckedNodes(params.rightData);
    };

    // 数据穿梭后
    const afterToward = () => {
      leftTree.value.setCheckedKeys([]);
      rightTree.value.setCheckedKeys([]);
    };

    //树形：搜索
    const leftFilterText = ref("");
    const rightFilterText = ref("");

    watch(leftFilterText, (val) => {
      leftTree.value.filter(val);
    });
    watch(rightFilterText, (val) => {
      rightTree.value.filter(val);
    });

    const filterNode = (value, data) => {
      if (!value) return true;
      return data.label.includes(value);
    };

    //左侧树重置
    const resetLeft = () => {
      leftFilterText.value = "";
      leftTree.value.setCheckedNodes([]); //取消全选
    };

    //右侧树重置
    const resetRight = () => {
      rightFilterText.value = "";
      rightTree.value.setCheckedNodes([]); //取消全选
    };

    //初始化
    const init = () => {
      leftFilterText.value = "";
      rightFilterText.value = "";
      fileIdList.value = [];
      clickAllSelectRight();
      towardsLeft();
    };

    //取消按钮
    const handleCancel = () => {
      emit("changeIsResourceShow", false);
      init();
    };

    //确定按钮
    const handleConfirm = () => {
      // console.log("确定", params.leftData, params.rightData);
      fileIdList.value = [];
      const res = getLeafFileId(params.rightData);
      console.log("筛选出来的数据", res);
      emit("confirmTransfer", res);
    };

    //获取穿梭框右侧的文件叶子节点的id，如果空文件夹为叶子节点，需要剔除
    const fileIdList = ref([]);
    const getLeafFileId = (tree) => {
      for (let item in tree) {
        if (tree[item].children.length >= 1) {
          getLeafFileId(tree[item].children);
        } else if (
          acceptFileType.value.includes(tree[item].label.split(".").pop())
        ) {
          fileIdList.value.push(tree[item].id);
        }
      }
      return fileIdList.value;
    };

    //写作中已选择的文件id，反显到穿梭框的树中
    const choosedFileId = ref([]);
    watch(
      () => props.isResourceShow,
      () => {
        setTimeout(() => {
          const path = window.location.href;
          const currentRoute = path.split("/").pop();
          if (dialogVisible.value && currentRoute === "write") {
            choosedFileId.value = props.choosedFileId;
            // console.log("穿梭框接收到的数据", choosedFileId.value);
            leftTree.value.setCheckedKeys(choosedFileId.value);
            towardsRight();
          }
        }, 0);
      },
      { immediate: true }
    );

    onMounted(() => {
      params.leftData = props.treeData;
      params.rightData = [];
      // choosedFileId.value = props.choosedFileId;
    });

    return {
      acceptFileType,
      dialogVisible,
      params,
      leftTree,
      rightTree,
      towardsRight,
      towardsLeft,
      // leftCheckedAll,
      clickAllSelectLeft,
      clickAllSelectRight,
      afterToward,
      // renderTree,

      leftFilterText,
      filterNode,
      rightFilterText,

      init,
      resetLeft,
      resetRight,
      handleCancel,
      handleConfirm,

      //图标
      Search,
      FolderOpened,
      Folder,
    };
  },
};
</script>
<style lang="less">
.dialog-modal {
  border-radius: 16px;

  .el-dialog__header {
    display: flex;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #d6dbe3;
    margin-right: 0px;

    .el-dialog__headerbtn {
      display: none;
    }
  }

  .el-dialog__footer {
    padding: 10px 24px;
    border-top: 1px solid #ccc;

    .confirm-btn {
      border: none;
      box-shadow: 0 8px 10px 0 rgba(23, 118, 255, 0.24),
        0 1px 4px 0 rgba(151, 71, 255, 0.24);
      background: linear-gradient(99deg, var(--blue) 0%, #9747ff 100%);
    }

    .cancel-btn:hover,
    .cancel-btn:focus {
      background: var(--white) !important;
      color: var(--blue) !important;
      border: 1px solid var(--blue);
    }
  }
}

.transfer-tree-box {
  display: flex;
  // width: 700px;
  width: 100%;
  justify-content: space-around;

  .select-box {
    border-radius: 16px;
    border: 1px solid #ccc;
    height: 354px;
    width: 350px;
    color: var(--white);
    position: relative;

    .box-title {
      height: 46px;
      line-height: 22px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      border-radius: 16px 16px 0 0;
      border-bottom: 1px solid #ccc;
      cursor: pointer;

      &-left {
        color: #3c485c;
        font-weight: 600;
      }

      &-right {
        color: #3c485c;
      }
    }

    .box-content {
      padding: 16px 12px;
      height: 260px;
      /* height: calc(100% - 78px); */

      .box-input {
        margin-bottom: 16px;
      }

      .box-center {
        height: 100%;
        width: 100%;
        max-height: 180px;
        overflow-y: auto;

        .el-tree {
          display: inline-block;
          min-width: 100%;

          span {
            display: flex;
            align-items: center;

            img {
              margin-right: 4px;
            }
          }
        }
      }
    }

    .box-bottom {
      border-top: 1px solid #ccc;
      padding: 8px 16px;
      display: flex;
      flex-direction: row-reverse;
    }

    .bottom-btn:hover,
    .bottom-btn:focus {
      background: var(--white) !important;
      color: var(--blue) !important;
      border: 1px solid var(--blue);
    }
  }

  .transfer-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .pick-btn {
      height: 32px;
      width: 32px;
      background: var(--blue);
      color: var(--white);
      font-weight: 700;
      font-size: 20px;
      border-radius: 5px;
      margin-top: 10px;
      text-align: center;
      line-height: 30px;
      cursor: pointer;
    }
  }
}
</style>
