<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { hexToHsl, hslToHex, normalizeHex } from '../theme';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [color: string] }>();
const hue = ref(0), saturation = ref(1), lightness = ref(0.5);
const color = computed(() => hslToHex(hue.value, saturation.value, lightness.value));
watch(() => props.modelValue, value => {
  const normalized = normalizeHex(value);
  // Keep the chosen hue/saturation at black, white and gray, where an RGB
  // round trip would otherwise discard them as the user moves a slider.
  if (!normalized || normalized === color.value) return;
  [hue.value, saturation.value, lightness.value] = hexToHsl(normalized);
}, { immediate: true });
function update(channel: 'hue' | 'saturation' | 'lightness', event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (channel === 'hue') hue.value = value;
  else if (channel === 'saturation') saturation.value = value / 100;
  else lightness.value = value / 100;
  emit('update:modelValue', color.value);
}
</script>

<template>
  <fieldset id="theme-color-controls" class="inline-color-picker">
    <legend>Color picker</legend>
    <label for="theme-hue">Hue <output>{{ Math.round(hue) }}°</output></label>
    <input id="theme-hue" type="range" min="0" max="360" step="1" :value="hue" :aria-valuetext="`${Math.round(hue)} degrees`" @input="update('hue', $event)" class="hue-range">
    <label for="theme-saturation">Saturation <output>{{ Math.round(saturation * 100) }}%</output></label>
    <input id="theme-saturation" type="range" min="0" max="100" step="1" :value="saturation * 100" :aria-valuetext="`${Math.round(saturation * 100)} percent`" :style="{ '--picker-track': `linear-gradient(to right, hsl(${hue} 0% ${lightness * 100}%), hsl(${hue} 100% ${lightness * 100}%))` }" @input="update('saturation', $event)">
    <label for="theme-lightness">Lightness <output>{{ Math.round(lightness * 100) }}%</output></label>
    <input id="theme-lightness" type="range" min="0" max="100" step="1" :value="lightness * 100" :aria-valuetext="`${Math.round(lightness * 100)} percent`" :style="{ '--picker-track': `linear-gradient(to right, #000, hsl(${hue} ${saturation * 100}% 50%), #fff)` }" @input="update('lightness', $event)">
    <p class="color-help">Adjust the sliders, then select Apply to save.</p>
  </fieldset>
</template>
