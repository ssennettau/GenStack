<script>
	import { page } from '$app/stores';
</script>

<main class="flex-grow flex items-center justify-center">
	<div class="bg-gray-800 p-6 rounded-lg shadow-md">
		<h1 class="font-semibold text-3xl">HTTP {$page.status}: {$page.error?.message}</h1>
		<p>Oof, something pretty unexpected has broken! Try again?</p>
	</div>
</main>