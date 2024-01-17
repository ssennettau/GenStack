<script lang="ts">
  import LoadingDots from "../UI/LoadingDots.svelte";

  import { AppState } from '$lib/stores/appv2.svelte'; 
  import { identifyPlaceholders, prepareGeneratingPlaceholder, processDependentValues, processPlaceholders } from '$lib/utils/prompts.svelte';
	import TypewriterText from "../UI/TypewriterText.svelte";

  // Props
  export let title: string;

  // Widget Details
  let widgetIndex: number = AppState.getWidgetByTitle(title).index || -1;
  let model: string | undefined = $AppState.widgets[widgetIndex].parameters?.model;
  let temperature = $AppState.widgets[widgetIndex].parameters?.temperature;
  let topP = $AppState.widgets[widgetIndex].parameters?.topp;
  let prompt: string | undefined = $AppState.widgets[widgetIndex].prompt + "";
  let placeholderText = prepareGeneratingPlaceholder(prompt || "");
  
  // Dependent Widgets Details
  const dependentWidgets: string[] = identifyPlaceholders(prompt);
  let dependentValues: DependentValues[];
  
  // Widget Visual Elements
  let loadingStatus: boolean = false;
  let output: string = "";

  // Trigger Generation
  $: {
    const rememberValues = dependentValues;
    let valuesValid: boolean = true;
    let valuesChanged: boolean;

    dependentValues = processDependentValues(dependentWidgets, $AppState);

    dependentValues.forEach((w) => {
      if (typeof w.value == "undefined") {
        valuesValid = false;
      }
    });

    valuesChanged = !(JSON.stringify(dependentValues) === JSON.stringify(rememberValues));
    
    if (valuesValid && valuesChanged) {
      callBedrock();
    }
  }

  // Generation Function
  async function callBedrock(): Promise<void> {
    console.log(`<WidgetTextGeneration:${title}> callBedrock()`);

    if (typeof prompt == "undefined") {
      // Unhandled - Shouldn't happen with well-formed definition files
      throw "Prompt not found";
    }

    loadingStatus = true;
    try {
      // Defaults to Claude v2
      if (typeof model == "undefined") {
        model = "bedrock-claude-v2";
      }

      let currentPrompt: PromptProcessed = processPlaceholders(prompt,$AppState);
      
      const resText = await fetch('/api/call-bedrock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: model,
          prompt: currentPrompt.prompt,
          temperature: temperature,
          topP: topP
        })
      });
      if (resText.ok) {
        const dataText = await resText.json();
        output = dataText.response;
        $AppState.widgets[widgetIndex].value = output;

        console.debug({title: title, originalPrompt: prompt, newPrompt: currentPrompt, response: output});
      } else {
        console.error(`Error: ${resText}`);
      }
    }
    finally {
      loadingStatus = false;
    }
  }
</script>

<div class="party-widget-ai">
  <div class="party-widget-header">
    <label for="output">{title}</label>
    <LoadingDots loadState={loadingStatus} />
  </div>
  <div class="party-widget-contents">
    {#if output}
      <TypewriterText input={output} />
    {:else}
      <span class="party-widget-placeholder">{@html placeholderText}</span>
    {/if}
  </div>
</div>