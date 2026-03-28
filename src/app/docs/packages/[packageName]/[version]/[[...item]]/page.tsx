import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocItem } from "@/components/DocItem";
import { Markdown } from "@/components/Markdown";
import { fetchHome } from "@/lib/docs/fetchHome";
import { fetchNode } from "@/lib/docs/fetchNode";
import { parseDocsPathParams } from "@/lib/docs/parseDocsPathParams";

export async function generateMetadata({
    params,
}: PageProps<"/docs/packages/[packageName]/[version]/[[...item]]">): Promise<Metadata> {
    const { packageName, version, item } = await params;
    if (!item) return {};

    const { nodeName } = parseDocsPathParams(item);
    if (!nodeName) notFound();

    const decodedItemName = decodeURIComponent(nodeName);
    const name = decodedItemName.split(":")?.[0] ?? decodedItemName;

    return {
        title: `${name} (${packageName} - ${version})`,
        openGraph: {
            images: [
                {
                    url: `/api/docs/og?pkg=${packageName}&item=${encodeURIComponent(nodeName)}`,
                    width: 1200,
                    height: 630,
                },
            ],
        },
    };
}

export default async ({ params }: PageProps<"/docs/packages/[packageName]/[version]/[[...item]]">) => {
    const { packageName, version, item } = await params;

    if (item === undefined) {
        const content = await fetchHome({ packageName, version });
        return <Markdown>{content}</Markdown>;
    }

    const { entryPoints, nodeName } = parseDocsPathParams(item);

    if (!nodeName) notFound();

    const node = await fetchNode({
        entryPoint: entryPoints.join("."),
        item: decodeURIComponent(nodeName),
        packageName,
        version,
    });

    if (!node) notFound();

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-4">
            <DocItem node={node} packageName={packageName} version={version} />
        </main>
    );
};
