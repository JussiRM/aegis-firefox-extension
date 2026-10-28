<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{ anchor?: HTMLElement }>();
const message = ref(''), error = ref(false), visible = ref(false);
const position = ref<Record<string, string>>({ visibility: 'hidden' });
let timer: ReturnType<typeof setTimeout> | undefined;

function updatePosition() {
  if (!props.anchor) return;
  const rect = props.anchor.getBoundingClientRect();
  position.value = {
    top: `${Math.max(12, rect.top)}px`, left: `${rect.left}px`,
    width: `${rect.width}px`, minHeight: `${rect.height}px`,
  };
}
const observer = new ResizeObserver(updatePosition);
watch(() => props.anchor, (anchor, previous) => {
  if (previous) observer.unobserve(previous);
  if (anchor) observer.observe(anchor);
  updatePosition();
}, { flush: 'post' });

function dismiss() {
  clearTimeout(timer);
  visible.value = false;
}

function show(text: string, options: { error?: boolean; duration?: number } = {}) {
  clearTimeout(timer);
  if (!text) { dismiss(); return; }
  message.value = text;
  error.value = options.error ?? false;
  updatePosition();
  visible.value = true;
  const duration = options.duration ?? 3500;
  // A zero duration keeps progress and errors visible until replaced/cleared.
  if (duration > 0) timer = setTimeout(dismiss, duration);
}

function afterLeave() {
  if (!visible.value) { message.value = ''; error.value = false; }
}

onMounted(() => {
  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
});
onUnmounted(() => {
  clearTimeout(timer);
  observer.disconnect();
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
defineExpose({ show, dismiss });
</script>

<template>
  <Teleport to="body">
    <div class="notification-host" :style="position" role="status" aria-live="polite" aria-atomic="true">
      <Transition name="notification" @after-leave="afterLeave">
        <div v-show="visible" id="status" class="status" :class="{ error }">{{ message }}</div>
      </Transition>
    </div>
  </Teleport>
</template>
