<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
<script setup lang="ts">
  defineProps<{
    name:
      | 'search'
      | 'menu'
      | 'plus'
      | 'log'
      | 'bell'
      | 'refresh'
      | 'chevron'
      | 'close'
      | 'more'
      | 'chart'
      | 'link'
      | 'pause'
      | 'play'
      | 'copy'
      | 'trash';
  }>();
  const paths = {
    search: 'M21 21l-5-5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
    menu: 'M4 6h16M4 12h16M4 18h16',
    plus: 'M12 4v16M4 12h16',
    log: 'M14 3H6a2 2 0 0 0-2 2v15h16V9l-6-6v6h6M8 13h8M8 17h8',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M18 18a8 8 0 0 1-14-6',
    chevron: 'M9 5l7 7-7 7',
    close: 'M6 6l12 12M6 18 18 6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    chart: 'M3 3v18h18M7 14l4-5 4 3 5-7',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
    pause: 'M8 5v14M16 5v14',
    play: 'M7 4l14 8-14 8V4',
    copy: 'M8 8h12v13H8V8M16 8V3H3v13h5',
    trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  };
</script>
<style scoped>
  svg {
    display: block;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
