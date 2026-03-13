<script lang="ts">
	import type { ResultProfile } from '$lib/data/types';

	interface Props {
		profile: ResultProfile;
		class?: string;
	}

	let { profile, class: className = '' }: Props = $props();
</script>

<div
	class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold {className}"
	style="background-color: {profile.accentColor}20; color: {profile.accentColor};"
>
	<span class="w-2 h-2 rounded-full" style="background-color: {profile.accentColor};"></span>
	{profile.name}
</div>
