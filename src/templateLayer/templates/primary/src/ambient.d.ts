type PartyRockApp = {
  appDetails: {
    title: string,
    author: string,
    appId: string,
    url: string,
  },
  widgets: {
    x: number,
    y: number,
    type: string,
    title: string,
    width: number,
    height: number,
    content?: string,
    placeholder?: string,
    defaultValue?: string,
    prompt?: string,
    imageDescription?: string,
    initialUserMessage?: string,
    initialAssistantMessage?: string,
    parameters?: {
      model?: string,
      temperature?: number,
      topp?: number
    },
    value?: string,
    messages?: {
      from: string,
      content: string,
    }[],
  }[],
}

type StableDiffusionPrompt = {
  text: string,
  weight: number,
}

type PromptProcessed = {
  prompt: string,
  completed: boolean,
}

type DependentValues = {
  id: number,
  title: string,
  value?: string,
}