<script lang="ts">
  import LoadingDots from "../UI/LoadingDots.svelte";
  
  import { AppState } from '$lib/stores/appv2.svelte'; 
  import { identifyPlaceholders, prepareGeneratingPlaceholder, processChatMessages, processDependentValues, processPlaceholders } from '$lib/utils/prompts.svelte';
  import type { EventHandler } from "svelte/elements";
  import ChatMessageHuman from "../UI/ChatMessageHuman.svelte";
  import ChatMessageAssistant from "../UI/ChatMessageAssistant.svelte";
  import { afterUpdate } from "svelte";
  import TypewriterText from "../UI/TypewriterText.svelte";
  
  // Props
  export let title: string;
  
  // Widget Details
  let widgetIndex: number = AppState.getWidgetByTitle(title).index || -1;
  let model: string | undefined = $AppState.widgets[widgetIndex].parameters?.model;
  let initialUserMessage: string | undefined = $AppState.widgets[widgetIndex].initialUserMessage + "";
  let initialAssistantMessage: string | undefined = $AppState.widgets[widgetIndex].initialAssistantMessage + "";
  let placeholder: string | undefined = $AppState.widgets[widgetIndex].placeholder;
  let placeholderText = prepareGeneratingPlaceholder(initialUserMessage || "", "chat");
  let newMessage: string;
  
  
  // Dependent Widgets Details
  const dependentWidgets: string[] = identifyPlaceholders(initialUserMessage);
  let dependentValues: DependentValues[];
  
  let messages = $AppState.widgets[widgetIndex].messages;
  
  
  // Triggered anytime the input(s) are updated
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
      // Initializing the messages
      $AppState.widgets[widgetIndex].messages = [];
      
      // Setup the initial messages
      let currentInitialUserMessage = processPlaceholders(initialUserMessage || "", $AppState);
      let currentInitialAssistantMessage = processPlaceholders(initialAssistantMessage || "", $AppState);
      
      // Adding the initial messages to the queue
      $AppState.widgets[widgetIndex].messages?.push({
        from: "Human",
        content: currentInitialUserMessage.prompt,
      });
      $AppState.widgets[widgetIndex].messages?.push({
        from: "Assistant",
        content: currentInitialAssistantMessage.prompt,
      });
      
      messages = $AppState.widgets[widgetIndex].messages;
    }
  }
  
  // Widget Visual Elements
  let loadingStatus: boolean = false;
  let output: string = "";
  let messagesContainer: HTMLElement;
  
  // Lifecycle Hooks
  afterUpdate(() => {
    messagesScroll();
  });
  
  async function messagesScroll(): Promise<void> {
    let targetHeight: number = 0;
    
    try {
      targetHeight = messagesContainer.scrollHeight || 0;
      messagesContainer.scrollTop = targetHeight;
    } catch {
      targetHeight = 0;
    }
    finally {
    }
  }
  
  // Generation Function
  async function callBedrock(): Promise<void> {
    console.log(`<WidgetChatbot:${title}> callBedrock()`);
    
    if (typeof initialUserMessage == "undefined") {
      // Unhandled - Shouldn't happen with well-formed definition files
      throw "initialUserMessage not found";
    }
    
    loadingStatus = true;
    try {
      // Defaults to Claude v2
      if (typeof model == "undefined") {
        model = "bedrock-claude-v2";
      }
      
      const resText = await fetch('/api/call-bedrock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: model,
          prompt: processChatMessages(messages)
        })
      });
      if (resText.ok) {
        const dataText = await resText.json();
        output = dataText.response;
        
        $AppState.widgets[widgetIndex].messages?.push({
          from: "Assistant",
          content: output,
        });
        
        messages = $AppState.widgets[widgetIndex].messages;
      } else {
        console.error(`Error: ${resText}`);
      }
    }
    finally {
      loadingStatus = false;
    }
  }
  
  async function addMessage(e: SubmitEvent): Promise<void> {
    $AppState.widgets[widgetIndex].messages?.push({
      from: "Human",
      content: newMessage,
    });
    messages = $AppState.widgets[widgetIndex].messages;
    if (typeof messages?.length != "undefined" && messages?.length > 2) {
      callBedrock();
    }
    newMessage = "";
  }
</script>

<div class="party-widget-ai">
  <div class="party-widget-header">
    <label for="output">{title}</label>
    <LoadingDots loadState={loadingStatus} />
  </div>
  <div class="party-widget-contents flex flex-col">
    {#if (messages?.length || 0) > 0}
    <div class="flex flex-col-reverse min-h-48 max-h-72 overflow-auto" bind:this={messagesContainer}>
      {#each messages || [] as message, index}
      {#if message.from == "Assistant"}
      <ChatMessageAssistant>
        <TypewriterText input={message.content} />
      </ChatMessageAssistant>
      {:else if message.from == "Human"}
      <ChatMessageHuman>
        {message.content}
      </ChatMessageHuman>
      {/if}
      {/each}
    </div>
    {:else}
    <span class="party-widget-placeholder min-h-48">{@html placeholderText}</span>
    {/if}
    <form class="border-t-2 border-black mt-2 pt-2 flex mt-auto" on:submit|preventDefault={addMessage}>
      <input type="text" placeholder={placeholder} class="flex-grow flex-shrink bg-inherit outline-none font-sans" bind:value={newMessage} disabled={ loadingStatus } />
      <button type="submit" class="flex-shrink-0 pl-2" disabled={ loadingStatus }>Send</button>
    </form>
  </div>
</div>