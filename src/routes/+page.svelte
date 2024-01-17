<script lang="ts">
  let textUrl: string = "";
  let toggleCss: boolean = true;
  let toggleSst: boolean = false;

  let validUrl: boolean;
  let isLoading: boolean = false;
  let isError: boolean = false;
  let errorMessage: string;

  console.log("PartySmith Loaded");

  const regexPattern = new RegExp("^http[s]{0,1}:\/\/partyrock.aws\/u\/.+?\/.*");
  $: validUrl = regexPattern.test(textUrl);

  async function callBuildApi(): Promise<void> {
    isError = false;
    isLoading = true;
    errorMessage = "";

    console.log("Build started...");

    try {  
      if (!validUrl) {
        errorMessage = `<div class="font-semibold">Invalid PartyRock URL</div>`;
        isError = true;
        return;
      }
      
      const response = await fetch('/api/build-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: textUrl,
          css: toggleCss,
          sst: toggleSst,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error(errorData);

        if (!errorData || response.status == 404) {
          errorMessage = `<div class="font-semibold">Network Error - Unable to access the API </div><div class="font-mono text-xs mt-2">HTTP-${response.status}</div>`;
        } else if (errorData.detail == "FailureGetAppDetails") {
          errorMessage = `<div class="font-semibold">Unable to retrieve the PartyRock App</div><div class="my-2">Have you confirmed the app is public?</div><span class="font-mono text-xs mt-2">${errorData.id}</span>`;
        } else {
          errorMessage = `<div class="font-semibold">Whoops! Something went wrong!</div><div class="font-mono text-xs mt-2">${errorData.id}</div>`;
        }

        isError = true;

        throw new Error(errorMessage);
      }

      const generatedApp = await response.json();
      const base64Data = generatedApp.contents;
      const decodedData = atob(base64Data);
      const byteNumbers = new Array(decodedData.length);

      for (let i = 0; i < decodedData.length; i++) {
        byteNumbers[i] = decodedData.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: "application/zip"});
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'app.zip';
      link.click();

      console.log(response);
      console.log(generatedApp);
    } catch (err) {
      isError = true;
    } finally {
      isLoading = false;
    }
  }
</script>

<main class="flex-grow flex items-center justify-center mb-16">
  <div class="bg-gray-800 p-6 rounded-lg shadow-md">
    <form class="space-y-4" on:submit|preventDefault={callBuildApi}>
      <div class="flex flex-col justify-center items-center">
        <input type="text" class="mt-1 p-2 text-black border rounded-md min-w-80 focus:outline-none focus:ring focus:border-yellow-500" placeholder="Enter PartyRock App URL" bind:value={textUrl} />
        {#if !validUrl && textUrl != ""}
          <p class="text-sm">Please enter a valid URL</p>
        {/if}
      </div>
      <div class="flex flex-col justify-center items-center space-y-1">
        <label class="flex items-center cursor-pointer">
          <input type="checkbox" bind:checked={toggleCss} class="hidden" />
          <div class="relative w-11 h-6 rounded-full {toggleCss ? 'bg-yellow-400' : 'bg-gray-700'}">
            <div class="absolute w-5 h-5 bg-white border border-gray-600 rounded-full top-0.5 left-0.5 transition-transform duration-200 ease-in-out transform-gpu {toggleCss ? 'translate-x-full' : ''}"></div>
          </div>
          <span class="ml-3 text-sm font-medium text-gray-300">Include Visual Theme</span>
        </label>
        
        <label class="flex items-center cursor-pointer">
          <input type="checkbox" bind:checked={toggleSst} class="hidden" />
          <div class="relative w-11 h-6 bg-gray-700 rounded-full {toggleSst ? 'bg-yellow-400' : 'bg-gray-700'}">
            <div class="absolute w-5 h-5 bg-white border border-gray-600 rounded-full top-0.5 left-0.5 transition-transform duration-200 ease-in-out transform-gpu {toggleSst ? 'translate-x-full' : ''}"></div>
          </div>
          <span class="ml-3 text-sm font-medium text-gray-300">Include SST</span>
        </label>
      </div>
      <div class="flex justify-center">
        <button type="submit" class="bg-gradient-to-t from-yellow-600 to-yellow-400 text-gray-900 font-mono px-8 py-2 rounded-lg shadow-xl">Generate App</button>
      </div>
    </form>
    {#if isLoading}
      <div class="flex flex-col w-full justify-center bg-green-800 p-3 mt-4 rounded">
        Loading...
      </div>
    {:else if isError}
      <div class="flex flex-col w-full items-center bg-red-800 p-3 mt-4 rounded">
        {@html errorMessage}
      </div>
    {/if}
  </div>
</main>
