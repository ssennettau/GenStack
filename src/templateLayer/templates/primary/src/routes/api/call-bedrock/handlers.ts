import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { create } from "domain";

const client = new BedrockRuntimeClient();
const textDecoder = new TextDecoder("utf-8");

function createParams(body: any, modelId: string) {
    return {
        body: JSON.stringify(body),
        modelId: modelId,
        accept: 'application/json',
        contentType: 'application/json',
    };
}

async function sendBedrockCommand(params: any, outputHandler: (response: any) => string): Promise<string> {
    const command = new InvokeModelCommand(params);
    let output = "";

    try {
        const data = await client.send(command);
        const response = JSON.parse(textDecoder.decode(data.body.buffer ?? data.body));

        output = outputHandler(response);

    } catch (err) {
        console.error(err);

        throw new Error("Unable to complete request");
    }

    return output;
}

export async function TextClaude(prompt: string, temperature = 0.5, topP = 1.0): Promise<string> {
    prompt = `Human: ${prompt}\n\nAssistant:`;

    const params = createParams({
        prompt: prompt,
        max_tokens_to_sample: 2048,
        temperature: temperature,
        top_p: topP,
    }, 'anthropic.claude-v2');

    const response = await sendBedrockCommand(params, (response) => response.completion.trim());

    return response;
}

export async function TextClaudeInstant(prompt: string, temperature = 0.0, topP = 1.0): Promise<string> {
    prompt = `Human: ${prompt}\n\nAssistant:`;

    const params = createParams({
        prompt: prompt,
        max_tokens_to_sample: 2048,
        temperature: temperature,
        top_p: topP,
    }, 'anthropic.claude-instant-v1');

    const response = await sendBedrockCommand(params, (response) => response.completion.trim());

    return response;
}

export async function TextAmazonTitanLite(prompt: string, temperature = 0.0, topP = 1.0): Promise<string> {
    prompt = `${prompt}`;

    const params = createParams({
        inputText: prompt,
        textGenerationConfig: {
            temperature: temperature,
            topP: topP,
        }
    }, 'amazon.titan-text-lite-v1');

    const response = await sendBedrockCommand(params, (response) => response.results[0].outputText.trim());

    return response;
}

export async function TextAmazonTitanExpress(prompt: string, temperature = 0.0, topP = 1.0): Promise<string> {
    prompt = `${prompt}`;

    const params = createParams({
        inputText: prompt,
        textGenerationConfig: {
            temperature: temperature,
            topP: topP,
        }
    }, 'amazon.titan-text-express-v1');

    const response = await sendBedrockCommand(params, (response) => response.results[0].outputText.trim());

    return response;
}

export async function TextAI21Jurassic2Mid(prompt: string, temperature = 0.5, topP = 0.5): Promise<string> {
    prompt = `${prompt}`;

    const params = createParams({
        prompt: prompt,
        temperature: temperature,
        topP: topP,
        maxTokens: 256,
    }, 'ai21.j2-mid-v1');

    const response = await sendBedrockCommand(params, (response) => response.completions[0].data.text.trim());

    return response;
}

export async function TextAI21Jurassic2Ultra(prompt: string, temperature = 0.5, topP = 0.5): Promise<string> {
    prompt = `${prompt}`;

    const params = createParams({
        prompt: prompt,
        temperature: temperature,
        topP: topP,
        maxTokens: 256,
    }, 'ai21.j2-ultra-v1');

    const response = await sendBedrockCommand(params, (response) => response.completions[0].data.text.trim());

    return response;
}

export async function TextCohereCommand(prompt: string, temperature = 0.9, topP = 0.75): Promise<string> {

    prompt = `${prompt}`;

    const params = createParams({
        prompt: prompt,
        temperature: temperature,
        p: topP,
    }, 'cohere.command-text-v14');

    const response = await sendBedrockCommand(params, (response) => response.generations[0].text.trim());

    return response;
}

export async function TextMetaLlama2_13b(prompt: string, temperature = 0, topP = 0.9): Promise<string> {
    prompt = `Human: ${prompt}\n\nAssistant:`;

    const params = createParams({
        prompt: prompt,
        temperature: temperature,
        top_p: topP,
        max_gen_len: 512,
    }, 'meta.llama2-13b-chat-v1');

    const response = await sendBedrockCommand(params, (response) => response.generation.trim());

    return response;
}

export async function TextMetaLlama2_70b(prompt: string, temperature = 0, topP = 0.9): Promise<string> {
    prompt = `Human: ${prompt}\n\nAssistant:`;

    const params = createParams({
        prompt: prompt,
        temperature: temperature,
        top_p: topP,
        max_gen_len: 512,
    }, 'meta.llama2-70b-chat-v1');

    const response = await sendBedrockCommand(params, (response) => response.generation.trim());

    return response;
}

export async function ImageStableDiffusion(prompt: string): Promise<string> {

    // Special sauce to create a descriptive prompt for the image
    prompt = `You are an art director that needs to describe an image based on the <input>${prompt}</input>.\n\n The description should be in short comma separated fragments using expressive adjectives and nouns.`;

    let img_prompt = (await TextClaude(prompt)).split('\n').pop()?.split(',');
    let text_prompts: StableDiffusionPrompt[] = [];

    img_prompt?.forEach((i) => {
        text_prompts.push({ "text": i.trim(), "weight": 1.0 });
    });

    // Keep only the first half of the prompts (the most valuable)
    text_prompts = text_prompts.slice(0, Math.ceil(text_prompts.length / 2));

    console.log(text_prompts);

    const params = createParams({
        text_prompts: text_prompts,
        width: 512,
        height: 512,
        steps: 50,
    }, 'stability.stable-diffusion-xl');

    const response = sendBedrockCommand(params, (response) => response.artifacts[0].base64.trim());

    return response;
}