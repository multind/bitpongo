<template><PlanDetails :key="planKey" /></template>
<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import PlanDetails from './PlanDetails.vue';
  const route = useRoute();
  const planKey = ref('');
  // A new plan gets isolated pagination, chart and request state while this route stays mounted.
  watch(
    () => route.query.id ?? route.query.planId,
    (id) => {
      planKey.value = typeof id === 'string' ? id : '';
    },
    { immediate: true },
  );
</script>
