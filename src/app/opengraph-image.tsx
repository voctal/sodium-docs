import { ImageResponse } from "next/og";

export const size = {
    width: 1_200,
    height: 630,
};

export const contentType = "image/png";

async function loadGoogleFont(font: string, text: string) {
    const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const resource = /src: url\((.+)\) format\('(opentype|truetype)'\)/.exec(css);

    if (resource) {
        const response = await fetch(resource[1]!);
        if (response.status === 200) {
            return response.arrayBuffer();
        }
    }

    throw new Error("failed to load font data");
}

export default async function Image() {
    const title = "Voctal Docs";
    const subtitle1 = "The official docs of the Voctal packages.";

    return new ImageResponse(
        <div
            tw="flex bg-[#121214] h-full w-full"
            style={{ background: "linear-gradient(to top right, #1c3047f0, #121214)" }}
        >
            <div tw="m-24 flex h-full">
                <div tw="flex flex-col font-black text-5xl text-white leading-tight">
                    <div tw="flex flex-row">
                        <span tw="text-blue-400 text-8xl" style={{ fontFamily: "GeistBold" }}>
                            {title}
                        </span>
                    </div>
                    <span tw="mt-6 text-gray-200">{subtitle1}</span>
                </div>
            </div>
        </div>,
        {
            ...size,
            fonts: [
                {
                    name: "Geist",
                    data: await loadGoogleFont("Geist:wght@600", title + subtitle1),
                    weight: 900,
                    style: "normal",
                },
                {
                    name: "GeistBold",
                    data: await loadGoogleFont("Geist:wght@900", title + subtitle1),
                    weight: 900,
                    style: "normal",
                },
            ],
        },
    );
}
