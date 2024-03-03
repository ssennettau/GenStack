import * as models from './handlers.js';

export async function POST(requestEvent): Promise<Response> {
    const { request } = requestEvent;
    const body = await request.json()

    let response: String;

    console.info(`> START model(${body.model})`);
    console.debug(body);

    switch (body.model) {
        case "bedrock-claude-v2":
            response = await models.TextClaude(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-claude-instant-v1":
            response = await models.TextClaudeInstant(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-amazon.titan-text-lite-v1":
            response = await models.TextAmazonTitanLite(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-amazon.titan-text-express-v1":
            response = await models.TextAmazonTitanExpress(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-ai21.j2-mid-v1":
            response = await models.TextAI21Jurassic2Mid(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-ai21.j2-ultra-v1":
            response = await models.TextAI21Jurassic2Ultra(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-cohere.command-v14":
            response = await models.TextCohereCommand(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-meta.llama2-13b-chat-v1":
            response = await models.TextMetaLlama2_13b(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-meta.llama2-70b-chat-v1":
            response = await models.TextMetaLlama2_70b(body.prompt, body.temperature, body.topP);
            break;
        case "bedrock-stable-diffusion-xl":
            response = await models.ImageStableDiffusion(body.prompt);
            break;
        default:
            return new Response(JSON.stringify({ error: "Invalid model" }), {
                status: 400
            });
    }

    const output = {
        response: response,
    };

    console.info(`> FINISH model(${body.model}) resp(${response.substring(0, 25)}...${response.substring(response.length - 25, response.length)})`);
    return new Response(JSON.stringify(output), {
        status: 200
    })
}

