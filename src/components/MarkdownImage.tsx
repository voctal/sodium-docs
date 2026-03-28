"use client";

import { useParams } from "next/navigation";
import { ClassAttributes, ImgHTMLAttributes } from "react";
import { PACKAGES } from "@/lib/constants";
import { resolvePackageImageURL } from "@/lib/links";
import { DocsParams } from "@/lib/types";

export function MarkdownImage(props: ClassAttributes<HTMLImageElement> & ImgHTMLAttributes<HTMLImageElement>) {
    const params = useParams<DocsParams | {}>();

    let src = String(props.src);
    if (!src.startsWith("http")) {
        if ("packageName" in params && src.startsWith("./.github/")) {
            const pkg = PACKAGES.find(p => p.name === params.packageName);
            if (!pkg) return null;

            src = resolvePackageImageURL(pkg.repository || pkg.name, params.version, src.slice(2));
        } else {
            return null;
        }
    }

    // oxlint-disable-next-line no-img-element
    return <img {...props} src={src} loading="lazy" className="rounded-lg" />;
}
