<script>
  import "../app.css";
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
  <header class="pt-16 text-center">
    <h1 class="text-4xl text-yellow-400 font-semibold">PartySmith</h1>
    <p class="text-gray-300 text-lg">Bringing the party to your place.</p>
  </header>
  <slot />
</div>

<footer class="flex flex-col items-center py-4 bg-gray-800 text-gray-300 fixed bottom-0 w-full">
  <div class="text-base">&copy; 2024 <a href="https://ssennett.net/" class="font-semibold hover:text-gray-500" target="_blank">Stephen Sennett</a></div>
  <div class="text-sm"><a href="https://github.com/ssennettau/partysmith/" class="font-semibold hover:text-gray-500" target="_blank">GitHub</a></div>
</footer>