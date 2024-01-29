<script>
  import "../app.css";
  import { dev } from '$app/environment';
</script>

<head>
  <title>PartySmith</title>
  <meta name="description" content="PartySmith transforms your AWS PartyRock apps into deployable full-stack SvelteKit applications.">
  <meta name="author" content="Stephen Sennett">
  <meta name="og:title" content="PartySmith">
  <meta name="og:description" content="PartySmith transforms your AWS PartyRock apps into deployable full-stack SvelteKit applications.">
  <meta name="og:locale" content="en_AU">
  <meta name="og:local:alternate" content="en_US">
  <meta name="og:url" content="https://partysmith.ssennett.net/">
  <meta name="og:image" content="https://partysmith.ssennett.net/logo.jpg">
</head>

<div class="min-h-screen flex flex-col">
  <header class="pt-16 mb-4 text-center">
    <h1 class="text-4xl text-yellow-400 font-semibold"><a href="/">PartySmith</a></h1>
    <p class="text-gray-300 text-lg">Bringing the party to your place.</p>
    {#if dev}
      <p class="text-sm text-yellow-200">&mdash; &#x26A0; Running in Development Mode &#x26A0; &mdash;</p>
    {/if}
  </header>
  <slot />
</div>

<footer class="flex flex-col items-center py-4 mt-4 bg-gray-900 text-gray-300 fixed bottom-0 w-full">
  {#if dev}
    <p class="text-xs text-yellow-200">&mdash; &#x26A0; Running in Development Mode &#x26A0; &mdash;</p>
  {/if}
  <div class="text-base">&copy; 2024 <a href="https://ssennett.net/" class="font-semibold hover:text-gray-500" target="_blank">Stephen Sennett</a></div>
  <div class="text-sm">
    <a href="/about" class="font-semibold hover:text-gray-500">About</a> 
    | 
    <a href="https://github.com/ssennettau/partysmith/" class="font-semibold hover:text-gray-500" target="_blank">GitHub</a></div>
</footer>