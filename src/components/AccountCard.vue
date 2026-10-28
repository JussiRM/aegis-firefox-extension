<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { generateTotp } from '../totp';
import type { Entry } from '../types';
const props = defineProps<{ entry: Entry; now: number; groupNames: Map<string, string>; busy: boolean; pinned: boolean }>();
const emit = defineEmits<{ togglePin: []; notify: [message: string, error?: boolean, temporary?: boolean] }>();
const title = computed(() => props.entry.issuer || props.entry.name || 'Unnamed account');
const code = ref('··· ···'), remaining = ref(props.entry.token.period), unavailable = ref(false);
const timer = ref({ key: '', duration: '', delay: '' });
const copyShine = ref(0);
// Keep animation timing stable between code changes. CSS owns every frame;
// updating its delay on each clock tick would make the fill jump.
watch([
  () => props.entry.token.period,
  () => Math.floor(props.now / (props.entry.token.period * 1000)),
], ([period, cycle]) => {
  timer.value = {
    key: `${period}:${cycle}`,
    duration: `${period}s`,
    delay: `${-(props.now % (period * 1000))}ms`,
  };
}, { immediate: true });
let step = -1, disposed = false;
async function update() {
  const now = props.now, period = props.entry.token.period;
  remaining.value = period - (now / 1000) % period;
  if (step === Math.floor(now / 1000 / period)) return;
  try {
    const result = await generateTotp(props.entry.token, now);
    if (disposed) return;
    const split = Math.ceil(result.code.length / 2);
    code.value = result.code.slice(0, split) + ' ' + result.code.slice(split); step = result.step;
  } catch {
    if (disposed) return;
    code.value = 'Unavailable'; unavailable.value = true;
    emit('notify', 'A code could not be generated. Try importing the vault again.', true);
  }
}
async function copy() {
  try {
    const result = await generateTotp(props.entry.token);
    if (disposed) return;
    await navigator.clipboard.writeText(result.code);
    if (!disposed) {
      copyShine.value += 1;
      emit('notify', 'Code copied.', false, true);
    }
  } catch { if (!disposed) emit('notify', 'Could not copy the code. You can select and copy it manually.', true); }
}
watch(() => props.now, () => void update(), { immediate: true });
onUnmounted(() => { disposed = true; });
</script>
<template>
  <article class="entry" :class="{ expiring: remaining <= 5, pinned }">
    <span v-if="copyShine" :key="copyShine" class="copy-shine" aria-hidden="true"></span>
    <div class="avatar">{{ title.slice(0, 1).toUpperCase() }}</div>
    <div class="entry-main">
      <div class="service">{{ entry.favorite ? '★ ' : '' }}{{ title }}</div>
      <div v-if="entry.name && entry.issuer" class="account">{{ entry.name }}</div>
      <div v-if="entry.groups.length" class="group-tags">{{ entry.groups.map(id => groupNames.get(id)).join(' · ') }}</div>
    </div>
    <div class="code-row">
      <button class="code" type="button" title="Copy current code" :disabled="busy || unavailable" :aria-label="`Copy code for ${title}${entry.issuer && entry.name ? `, ${entry.name}` : ''}`" @click="copy">{{ code }}</button>
      <div class="timer-bar">
        <progress :max="entry.token.period" :value="remaining" :aria-label="`Time remaining for ${title}`"></progress>
        <span :key="timer.key" class="timer-fill" :style="{ animationDuration: timer.duration, animationDelay: timer.delay }" aria-hidden="true"></span>
      </div>
    </div>
    <button class="icon-button pin-button" type="button" :disabled="busy" :aria-pressed="pinned" :title="pinned ? 'Unpin' : 'Pin to top'" :aria-label="`${pinned ? 'Unpin' : 'Pin to top:'} ${title}${entry.issuer && entry.name ? `, ${entry.name}` : ''}`" @click="emit('togglePin')">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path class="pin-head" d="M8 3h8l-1 6 3 4v2H6v-2l3-4z"/><path d="M12 15v6"/></svg>
    </button>
  </article>
</template>
