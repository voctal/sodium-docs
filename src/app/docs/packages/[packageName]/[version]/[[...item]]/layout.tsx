import type { Metadata } from "next";
import { Suspense } from "react";
import { CmdK } from "./CmdK";

export async function generateMetadata({
    params,
}: LayoutProps<"/docs/packages/[packageName]/[version]/[[...item]]">): Promise<Metadata> {
    const { packageName, version } = await params;

    return {
        title: {
            template: "%s | Voctal",
            default: `${packageName} (${version})`,
        },
    };
}

export default async function Layout({
    params,
    children,
}: LayoutProps<"/docs/packages/[packageName]/[version]/[[...item]]">) {
    return (
        <div className="lg:mx-10 lg:m-4">
            {children}
            <Suspense>
                <CmdK params={params} />
            </Suspense>
        </div>
    );
}
