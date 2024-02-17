import * as builder from './builder.js';

export async function POST(requestEvent): Promise<Response> {
    const { request } = requestEvent;
    const body = await request.json();

    const appRequest: AppRequest = {
        url: body.url,
        optStylesheet: body.css,
        optSst: body.sst,
    };

    let response: any;
    response = await builder.buildGenStackApp(appRequest);

    if (response.status == true) {
        return new Response(JSON.stringify(response.body), {
            status: 200
        });
    } else {
        return new Response(JSON.stringify(response.body), {
            status: 500
        });
    }
}

