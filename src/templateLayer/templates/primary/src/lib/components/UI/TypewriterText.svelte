<script lang="ts">
	export let input: string;

  let output: string = "";
  
  async function revealText(content: string): Promise<void> {
    output = "";
    for (let i=0; i < content.length; i++) {
      output += content[i];

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  $: {
    revealText(input);
  }
</script>

{output}