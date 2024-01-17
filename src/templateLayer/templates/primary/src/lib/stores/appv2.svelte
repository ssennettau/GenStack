<script context="module" lang="ts">
  import { writable, type Writable } from "svelte/store";
  import definition from './definition.json';

  const appTitle: string = definition.result.data.title;
  const appAuthor: string = definition.result.data.username;
  const appId: string = definition.result.data.appId;
  const appUrl: string = `https://partyrock.aws/u/${appAuthor}/${appId}/${appTitle.trim().replaceAll(' ','-')}`;

  const data: PartyRockApp = {
    appDetails: {
      title: appTitle,
      author: appAuthor,
      appId: appId,
      url: appUrl,
    },
    widgets: [
      ...definition.result.data.definition.widgets
    ]
  }

  function createAppState() {
    const { subscribe, set, update } = writable(data);

    return {
      subscribe,
      set,
      update,
      getWidgetByTitle: (title: string) => {
        let widgetIndex;
        const widget = data.widgets.find((widget, index) => {
          if (widget.title === title) {
            widgetIndex = index;
            return true;
          }
          return false;
        });
        return {widget, index: widgetIndex};
      },
      setWidgetValueByTitle: (title: string, value: string) => {
        update(state => {
          const widget = state.widgets.find(widget => widget.title === title);
          if (widget) {
            widget.value = value;
          }
          return state;
        });
      }
    }
  }

  export const AppState = createAppState();
</script>