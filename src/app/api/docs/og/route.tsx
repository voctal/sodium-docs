import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { resolveKindIcon, resolveNodeKindSpanClass } from "@/lib/kind";
import { cn } from "@/lib/utils";

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

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const pkg = searchParams.get("pkg") ?? "unknown";
    const item = searchParams.get("item") ?? "";

    const decodedInfo = decodeURIComponent(item).split(":");
    if (decodedInfo.length !== 2) return NextResponse.error();

    const [name, kind] = decodedInfo;
    const wrappedName = smartWrap(name, 20);

    return new ImageResponse(
        <div tw="flex bg-[#121214] h-full w-full">
            <div tw="flex h-full w-full" style={{ background: "linear-gradient(to top right, #1c3047f0, #121214)" }}>
                <div tw="flex flex-col m-24">
                    <div tw="flex flex-col text-5xl text-blue-400 leading-tight">
                        <div tw="flex flex-row">@voctal/{pkg}</div>
                    </div>

                    <div tw={cn(resolveNodeKindSpanClass(kind), "flex items-start text-white text-7xl mt-12")}>
                        {resolveKindIcon(kind, 64)}
                        <div tw="flex flex-col -mt-1">
                            {wrappedName.map(n => (
                                <span tw="ml-4">{n}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        {
            ...size,
            fonts: [
                {
                    name: "Geist",
                    data: await loadGoogleFont("Geist:wght@900", "@voctal/" + pkg + name),
                    weight: 900,
                    style: "normal",
                },
            ],
            headers: {
                "Cache-Control": "public, max-age=600",
            },
        },
    );
}

function hardWrap(text: string, max = 20) {
    const result: string[] = [];
    let buf = "";

    for (const char of text) {
        buf += char;
        if (buf.length >= max) {
            result.push(buf);
            buf = "";
        }
    }

    if (buf) result.push(buf);
    return result;
}

function smartWrap(text: string, max = 28) {
    return text
        .split(" ")
        .flatMap(word => (word.length > max ? hardWrap(word, max) : [word]))
        .reduce((lines, word) => {
            const last = lines.at(-1) ?? "";
            if ((last + " " + word).length > max) {
                lines.push(word);
            } else {
                lines[Math.max(0, lines.length - 1)] = last ? last + " " + word : word;
            }
            return lines;
        }, [] as string[]);
}
