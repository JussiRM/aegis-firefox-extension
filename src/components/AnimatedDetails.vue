<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ label: string; summaryId?: string }>();
const details = ref<HTMLDetailsElement>(), content = ref<HTMLDivElement>();
const expanded = ref(false);
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let animation: Animation | undefined;

function cancelAnimations() {
  if (animation) animation.onfinish = null;
  animation?.cancel();
  animation = undefined;
}

function settle() {
  cancelAnimations();
  if (details.value) details.value.open = expanded.value;
}

function toggle() {
  const section = details.value, panel = content.value;
  if (!section || !panel) return;
  // Start a reversal at the current visible height, even during an animation.
  const previousHeight = section.open ? panel.getBoundingClientRect().height : 0;
  expanded.value = !expanded.value;
  cancelAnimations();
  if (motionPreference.matches) {
    settle();
    return;
  }

  // Measure without exposing the fully expanded layout to Firefox's popup
  // sizing observer. It otherwise grows, shrinks, then grows again on opening.
  panel.style.height = `${previousHeight}px`;
  // Keep the native details open until the closing animation finishes.
  section.open = true;
  const nextHeight = expanded.value ? panel.scrollHeight : 0;
  const timing = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
  animation = panel.animate([
    { height: `${previousHeight}px`, overflow: 'clip' },
    { height: `${nextHeight}px`, overflow: 'clip' },
  ], timing);
  panel.style.height = '';
  animation.onfinish = settle;
}

onMounted(() => motionPreference.addEventListener('change', settle));
onUnmounted(() => {
  motionPreference.removeEventListener('change', settle);
  settle();
});
</script>

<template>
  <details ref="details" class="settings-section">
    <summary :id="summaryId" :aria-expanded="expanded" @click.prevent="toggle">{{ label }}</summary>
    <div ref="content" class="settings-panel" :inert="!expanded"><slot /></div>
  </details>
</template>
