export function GET(): Response {
    return new Response(JSON.stringify({
        message: 'Hello world!'
    }), {
        status: 200
    });

}

export async function POST(requestEvent): Promise<Response> {
    const { request } = requestEvent;

    const body = await request.json();

    return new Response(JSON.stringify(body), {
        status: 200
    });
}