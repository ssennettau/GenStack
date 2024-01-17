<script lang="ts">
  export let loadState: boolean;
</script>

{#if loadState}
  <div class='party-widget-loading'>
    <span class='sr-only'>Loading...</span>
    <div class='party-widget-loading-dot3'></div>
    <div class='party-widget-loading-dot2'></div>
    <div class='party-widget-loading-dot1'></div>
    <div class='party-widget-loading-dot2'></div>
    <div class='party-widget-loading-dot3'></div>
  </div>
{/if}