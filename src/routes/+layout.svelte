<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';

	let { children } = $props();

	onMount(() => {
		sessionStore.hydrateFromUrl(new URLSearchParams(window.location.search));
	});
</script>

<svelte:head>
	<title>Lotz</title>
	<meta name="description" content="Protocolo Milimétrico Lotz — seu plano personalizado." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-bg">
	{@render children()}
</div>
