<template>
  <div class="left-content">
    <div class="drawer-full">
      <div class="drawer-top">
        <a-dropdown
          trigger="click"
          placement="bottomLeft"
          overlayClassName="drop"
        >
          <a-button type="primary" class="btn">
            <folder-add-outlined />
            <span class="btn-title">导入文件</span>
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item>
                <desktop-outlined />
                <a-upload
                  multiple
                  name="file"
                  accept=".pdf, .docx, .doc, .xlsx, .csv, .txt"
                  class="btn-upload"
                  :show-upload-list="false"
                  :beforeUpload="beforeUpload"
                >
                  <div class="title">本地文件导入</div>
                </a-upload>
              </a-menu-item>
              <a-menu-item>
                <file-text-outlined />
                <div class="title" @click="importResource">资源库导入</div>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a-tooltip title="返回任务列表页">
          <img
            src="@/assets/images/img/icon-return.svg"
            alt=""
            @click="reback"
          />
        </a-tooltip>
      </div>
      <div class="drawer-middle" v-if="!readNum">
        <div class="left">
          单文件阅读 <icon-svg icon-class="read-change" @click="changeNum" />
        </div>
      </div>
      <div class="drawer-middle" v-if="readNum">
        <div class="left">
          多文件阅读 <icon-svg icon-class="read-change" @click="changeNum" />
        </div>
        <div class="right">
          <a-checkbox
            v-model:checked="selectAll"
            @change="handleSelectAll"
            :disabled="abortController"
          >
            全选
          </a-checkbox>
        </div>
      </div>
      <div class="drawer-divider">
        <a-divider style="border-color: #d6dbe3" dashed />
      </div>

      <div class="drawer-bottom">
        <a-spin tip="正在加载" v-if="loading" />
        <div
          v-else
          :class="[
            'drawer-bottom-item',
            fileIdList.includes(item.id) && !readNum ? 'active' : '',
            checkedFile.includes(item.id) && readNum ? 'active' : '',
          ]"
          v-for="(item, index) in fileList"
          :key="index"
          @click="
            (e) => {
              e.preventDefault();
              handleOpenChat(item);
            }
          "
        >
          <div class="item-content">
            <div class="left" v-if="!readNum">
              <img
                alt="message"
                class="message-img"
                src="@/assets/images/img/read-file.svg"
              />
              <a-tooltip>
                <template #title>{{ item.title }}</template>
                <span class="title">{{ item.title }}</span>
              </a-tooltip>
            </div>
            <div class="left" v-if="readNum">
              <img
                alt="message"
                class="message-img"
                src="@/assets/images/img/read-file.svg"
              />
              <a-checkbox
                class="title"
                v-model:checked="item.selected"
                :disabled="abortController"
                @click.stop
                @change.stop="handleItemSelect(item)"
              >
                <a-tooltip>
                  <template #title>{{ item.title }}</template>
                  <span class="title">{{ item.title }}</span>
                </a-tooltip>
              </a-checkbox>
            </div>
            <div class="right" v-if="!readNum">
              <a-tooltip title="删除">
                <img
                  alt="message"
                  class="img"
                  src="@/assets/images/img/delete.svg"
                  @click.stop="deleteFile(item.id)"
                />
              </a-tooltip>
            </div>
          </div>
          <div class="item-des">
            <span class="time">{{ item.updateDate }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- <TransferModal
    v-if="isResourceShow"
    :isResourceShow="isResourceShow"
    :tData="tData"
    :hasChild="hasChild"
    :taskDetailId="taskDetailId"
    @changeIsResourceShow="changeIsResourceShow"
    @getFileDetail="getFileDetail"
  ></TransferModal> -->
  <tree-transfer
    ref="treeTransferCp"
    v-if="isResourceShow"
    :treeData="tData"
    :isResourceShow="isResourceShow"
    @changeIsResourceShow="changeIsResourceShow"
    @confirmTransfer="confirmTransfer"
  ></tree-transfer>
</template>

<script>
import TreeTransfer from "@/components/treeTransfer";
import {
  delFile,
  getFileList,
  uploadFile,
  uploadFileFromResource,
} from "@/shared/api/read";
import { modalConfirmCancel } from "@/utils/common";
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Menu,
  Spin,
  Tooltip,
  Upload,
  message,
} from "ant-design-vue";
import { onMounted, ref } from "vue";
// import TransferModal from "./transferModal";

export default {
  name: "LeftMenu",
  components: {
    AButton: Button,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    ADropdown: Dropdown,
    ADivider: Divider,
    ATooltip: Tooltip,
    AUpload: Upload,
    ACheckbox: Checkbox,
    ASpin: Spin,
    // TransferModal,
    TreeTransfer,
  },
  props: ["tData", "taskDetailId", "currentFile", "abortController"],
  emits: [
    "changeTaskId",
    "changeConversationId",
    "changeIsReadyForChat",
    "changeCurrentFile",
    "changeReaderShow",
    "changeFileMd5List",
    "changeContent",
    "changeShowDetail",
    "changeCopyContent",
    "changeQuesInput",
  ],
  setup(props, { emit }) {
    //----与会话相关
    const singleConversationId = ref(undefined); //单文件会话id
    const multipleConversationId = ref(undefined); //多文件会话id

    //初始化置空
    const init = () => {
      fileIdList.value = []; //切换模式前将所选文件列表清空
      checkedFile.value = [];
      selectAll.value = false; //全选框置空
      fileList.value.map((item) => (item.selected = false)); //模式切换时，将多选框重置为初始状态
      emit("changeQuesInput", "");
      emit("changeIsReadyForChat", false);
      emit("changeContent", []);
      emit("changeReaderShow", false);
      emit("changeCopyContent", null);
      emit("changeConversationId", null); //修改聊天组件中的会话id
    };

    //-----左侧文件列
    //文件列表
    const fileList = ref([]);
    const loading = ref(false);
    const getFileDetail = async (id) => {
      readNum.value = false;
      init();
      loading.value = true;
      const res = await getFileList(id);
      loading.value = false;
      if (res.message === "成功") {
        if (res.data) {
          multipleConversationId.value = res.data.multipleDiaUUID; //修改多文件阅读时的会话id
          fileList.value =
            (res.data.fileList &&
              res.data.fileList.map((item) => ({
                title: item.file.fileName,
                selected: false,
                id: item.file.id,
                fileMd5: item.file.fileMd5,
                updateDate: item.file.updateDate,
                dialogueUUID: item.dialogueUUID,
              }))) ||
            [];
        }
      } else {
        message.error(res.message);
      }
    };

    const isEdit = ref(false);
    //删除某一文件
    const deleteFile = (id) => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      isEdit.value = true;
      const title = "是否确认删除该任务？";
      const content =
        "该操作将删除目标文件，该操作不可撤回，请确认是否继续删除？";
      const onOk = async () => {
        const res = await delFile(id);
        isEdit.value = false;
        if (res.message === "成功") {
          if (fileIdList.value.indexOf(id) !== -1) {
            fileIdList.value.splice(
              fileIdList.value.findIndex((item) => item === id),
              1
            );
            emit("changeContent", []); //修改聊天组件聊天内容展示区为空
            emit("changeIsReadyForChat", false); //修改聊天组件对话输入框的状态为可用
            if (fileIdList.value.length) {
              fileIdList.value = [];
            }
          }
          await getFileDetail(props.taskDetailId);
          if (props.currentFile.url === id) {
            emit("changeCurrentFile", "", "", "");
            emit("changeReaderShow", false);
          }
        } else {
          message.error(res.message);
        }
      };
      const onCancel = async () => {
        isEdit.value = false;
      };
      modalConfirmCancel(title, content, onOk, onCancel);
    };

    //单文件阅读：false  多文件阅读：true
    const readNum = ref(false);
    const changeNum = () => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      if (!fileList.value.length) {
        return message.warning("当前任务不存在文件，请先导入文件！", 1);
      }
      init();
      readNum.value = !readNum.value;
    };

    //单文件阅读时点击每一项，更新所选文件列表+pdf阅读器展示;多文件阅读时点击非复选框，更改pdf阅读器内容
    const checkedFile = ref([]); //多文件阅读模式下，阅读器展示的是哪一个文件；
    const fileIdList = ref([]);
    const handleOpenChat = (item) => {
      if (isEdit.value) {
        return;
      }
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      //修改展示区域的当前文件
      const url = item.id;
      // 截取文件名中的文件后缀，下面这样写为了防止文件名中可能的多个.
      const titleArr = item.title.split(".");
      const type = titleArr[titleArr.length - 1];
      const title = item.title.split(`.${type}`)[0];
      emit("changeCurrentFile", url, type, title);
      if (type === "doc") {
        message.info("暂不支持doc文件预览，敬请期待！");
        emit("changeReaderShow", false);
      } else {
        emit("changeReaderShow", true);
      }
      //单文件选择时，fileIdList立即更新
      if (!readNum.value) {
        fileIdList.value = [];
        fileIdList.value.push(item.id);
        singleConversationId.value = item.dialogueUUID; //修改单文件阅读时的会话Id
        handleReady();
      }
      //多文件阅读模式下，阅读器展示的是哪一个文件
      if (readNum.value) {
        checkedFile.value = [];
        checkedFile.value.push(item.id);
      }
    };

    //多文件全选
    const selectAll = ref(false);
    // 全选状态改变时，改变所有选项的选中状态
    const handleSelectAll = (e) => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      fileList.value.forEach((item) => {
        item.selected = e.target.checked;
      });
      if (e.target.checked) {
        fileIdList.value = fileList.value.map((item) => {
          return item.id;
        });
      } else {
        fileIdList.value = [];
      }
      confirmFileSelect();
    };

    // 多文件阅读。勾选每个文件时，检查所有选项的选中状态，设置全选状态+更新所选的fileIdList
    const handleItemSelect = () => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      const res = fileList.value.filter((item) => item.selected == true);
      const arr = res.map((item) => item.id);
      fileIdList.value = arr;
      selectAll.value = fileList.value.every((item) => item.selected);
      confirmFileSelect();
    };

    //获取当前所选中文件的fileMd5List,修改input框的使用状态
    const handleReady = () => {
      const fileMd5List = []; //会话新增参数
      for (let i = 0; i < fileIdList.value.length; i++) {
        fileList.value.map((item) => {
          if (item.id === fileIdList.value[i]) {
            fileMd5List.push(item.fileMd5);
          }
        });
      }
      emit("changeFileMd5List", fileMd5List);
      emit(
        "changeConversationId",
        readNum.value === false
          ? singleConversationId.value
          : multipleConversationId.value
      ); //修改聊天组件中的会话id
      emit("changeIsReadyForChat", true); //修改聊天组件对话输入框的状态为可用
    };

    //确认所选的当前文件
    const confirmFileSelect = async () => {
      //多文件阅读，需选择1个以上的文件
      if (readNum.value && fileIdList.value.length <= 1) {
        emit("changeIsReadyForChat", false);
        return message.warning("多文件阅读，请至少选择两个文件！", 0.5);
      }
      handleReady();
    };

    // 上传文件
    const beforeUpload = async (file) => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      if (file) {
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("taskId", props.taskDetailId);
        const res = await uploadFile(formData);
        if (res.message === "成功") {
          getFileDetail(props.taskDetailId);
        } else {
          message.error(res.message);
        }
      }
      return false; // 阻止默认访问当前ip下的某个路径的行为
    };

    //------资源库导入文件
    const isResourceShow = ref(false);
    const treeTransferCp = ref(null);
    const importResource = () => {
      if (props.abortController) {
        return message.warning("正在对话中，请稍后再试！");
      }
      isResourceShow.value = true;
    };
    const changeIsResourceShow = (value) => {
      isResourceShow.value = value;
    };

    //资源库导入文件确认，穿梭框弹框确认按钮
    const confirmTransfer = async (value) => {
      const json = {
        fileIdList: value,
        readTaskId: props.taskDetailId,
      };
      const res = await uploadFileFromResource(json);
      if (res.code === 0 && res.message === "成功") {
        getFileDetail(props.taskDetailId);
      } else if (res.code === 16203) {
        message.warning("上传文件中包含同名文件，请重新上传！" + res.message);
      } else {
        message.error(res.message);
      }
      isResourceShow.value = false;
      treeTransferCp.value.init();
    };

    //点击返回按钮，回到上一页:任务列表页
    const reback = () => {
      emit("changeIsReadyForChat", false);
      emit("changeReaderShow", false);
      emit("changeCopyContent", null);
      emit("changeTaskId", null);
      emit("changeConversationId", null);
      emit("changeFileMd5List", []);
      emit("changeShowDetail", false); //返回至任务列表页
    };

    onMounted(async () => {
      await getFileDetail(props.taskDetailId);
    });

    return {
      //----与会话相关
      singleConversationId,
      multipleConversationId,

      //-----左侧文件列
      fileList,
      loading,
      getFileDetail,
      deleteFile,
      //isFileSelect,
      //changeFileSelect,
      readNum,
      changeNum,
      selectAll,
      handleSelectAll,
      handleItemSelect,
      beforeUpload,
      isResourceShow,
      treeTransferCp,
      importResource,
      changeIsResourceShow,
      confirmTransfer,
      reback,

      fileIdList,
      checkedFile,
      handleOpenChat,
      //cancelFileSelect,
      confirmFileSelect,
    };
  },
};
</script>
<style lang="less">
@import url("./index.less");
</style>
