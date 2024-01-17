<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { AppState } from '$lib/stores/appv2.svelte';
  
  export let title: string;
  
  let widget = AppState.getWidgetByTitle(title).widget;
  
  let placeholder: string | undefined = widget?.placeholder;
  let defaultValue: string | undefined = widget?.defaultValue;

  let widgetIndex: number = AppState.getWidgetByTitle(title).index || 0;

  let value: string | undefined = defaultValue;

  let rememberValue: string | undefined = "";
  let timeoutId: number | NodeJS.Timeout | undefined;
  
  $: {
    if (value != '') {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (value != rememberValue) {          
          //console.debug($AppState);
          $AppState.widgets[widgetIndex].value = value;
          rememberValue = value;
          console.log(`<WidgetUserInput:${title}> updated`);
        }
      }, 2000);
    }
  }

  onMount(() => {
    rememberValue = value;
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });
  onDestroy(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
</script>
  
  <div class="party-widget-input">
    <div class="party-widget-header"><label for="input">{title}</label></div>
    <div class="party-widget-contents">
      <textarea id="input" bind:value={value} placeholder={placeholder}></textarea></div>
  </div>