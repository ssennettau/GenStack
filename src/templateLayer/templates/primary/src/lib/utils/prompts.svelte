<script context="module" lang="ts">
  import { AppState } from "$lib/stores/appv2.svelte";
  
  export function identifyPlaceholders(prompt: string): string[] {
    const regex = /\[(.*?)\]/g;

    let placeholders: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(prompt)) !== null) {
      placeholders.push(match[1]);
    }
    
    return placeholders;
  }

  export function prepareGeneratingPlaceholder(prompt: string, type: string = "text"): string {
    let placeholders = identifyPlaceholders(prompt);

    let action: string = type === "chat" ? "Chat" : "Generating";
    let verb: string = placeholders.length > 1 ? "are" : "is";
    let placeholdersStatement = placeholders.join('</span> and <span class="party-widget-placeholder-highlighter">');

    const output = `${action} as soon as <span class="party-widget-placeholder-highlighter">${placeholdersStatement}</span> ${verb} filled.`;

    return output
  }

  export function processChatMessages(messages: any): string {
    let fullMessage: string = "";

    for (let i=0; i<messages.length; i++) {
      fullMessage += `${messages[i].from}: ${messages[i].content}\n\n`
    }

    fullMessage += "Assistant:";

    return fullMessage;
  }

  export function processDependentValues(dependentWidgets: string[], app: PartyRockApp): DependentValues[] {
    const widgets = app.widgets;
    
    let dependentValues: DependentValues[] = [];
    
    dependentWidgets.forEach((w) => {
      const dIndex = AppState.getWidgetByTitle(w).index || 0;
      const dTitle = app.widgets[dIndex].title;
      const dValue = app.widgets[dIndex].value;

      dependentValues.push({
        id: dIndex,
        title: dTitle,
        value: dValue
      });
    });
    
    return dependentValues;
  }

  export function processPlaceholders(prompt: string, app: PartyRockApp) {
    const originalPrompt = prompt;
    const widgets = app.widgets;

    console.log(prompt);
    
    const regex = /\[(.*?)\]/g;
    const matches = prompt.match(/\[(.*?)\]/g) || [];

    matches.forEach((match) => {
      const key = match.slice(1, -1); // remove brackets
      let replacement: string | undefined = "";
      let replaced = false;
      
      widgets.forEach((widget) => {
        if (widget.title === key) {
          replacement = widget.value;
          replaced = true;
        }
      });

      if (!replaced) {
        throw "Unable to parse prompt placeholders";
      }

      prompt = prompt.replace(match, replacement);
    });

    // Used during development to track how the prompts were being modified, now done in widgets.
    console.debug({originalPrompt: originalPrompt, processedPrompt: prompt});

    return {
      prompt: prompt,
      completed: true,
    };
  }
</script>