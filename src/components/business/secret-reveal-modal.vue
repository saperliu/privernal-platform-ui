<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElButton as __forwarded_ElButton } from 'element-plus';

export interface Props {
  visible: boolean;

  title?: string;

  /** 与密钥成对出现的标识（OpenAPI 的 AccessKey，Webhook 的订阅地址） */
  label?: string;

  labelValue?: string;

  secret?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '密钥明文',
  label: '',
  labelValue: '',
  secret: ''
});

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const emit = defineEmits<Emits>();
const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
});

const copiedSecret = ref(false);

watch(visible, value => {
  if (!value) {
    copiedSecret.value = false;
  }
});

async function copyText(text: string, flag: 'secret' | 'label' = 'secret') {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    if (flag === 'secret') {
      copiedSecret.value = true;
    }
    window.$message?.success('已复制到剪贴板');
  } catch {
    // 非安全上下文（http 域名）下浏览器会拒绝剪贴板 API，此时提示用户手动选中
    window.$message?.error('浏览器不允许自动复制，请手动选中后复制');
  }
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
</script>

<template>
  <ElDialog v-model="visible" :title="title" class="w-640px">
    <ElAlert type="warning" class="mb-16px">
      密钥只在创建或轮换成功后显示这一次，关闭后无法再查看。请现在复制并交给调用方；需要更换时走「轮换」生成新密钥。
    </ElAlert>

    <ElDescriptions label-position="left" :column="1" size="small">
      <ElDescriptionsItem v-if="label" :label="label">
        <div class="flex items-center gap-8px">
          <span class="break-all">{{ labelValue }}</span>
          <ElButton size="small" @click="copyText(labelValue, 'label')">复制</ElButton>
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="Secret">
        <div class="flex items-center gap-8px">
          <span class="break-all font-mono">{{ secret }}</span>
          <ElButton size="small" type="primary" :disabled="copiedSecret" @click="copyText(secret)">
            {{ copiedSecret ? '已复制' : '复制' }}
          </ElButton>
        </div>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElSpace justify="end">
        <ElButton type="primary" @click="visible = false">我已保存</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>
