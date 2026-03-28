import Link from "next/link";
import { PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { MarkdownImage } from "./MarkdownImage";
import { Scrollbars } from "./OverlayScrollbars";
import { SyntaxHighlighter } from "./SyntaxHighlighter";

export function Markdown({
    children,
    small,
    className: providedClassName,
}: PropsWithChildren<{ small?: boolean; className?: string }>) {
    const className = small
        ? "prose prose-neutral dark:prose-invert prose-h1:text-xl prose-h1:my-2 prose-p:m-0 prose-a:[&>img]:inline-block prose-a:[&>img]:m-0 prose-a:[&>img[height='44']]:h-11 prose-pre:py-3 prose-pre:rounded-sm prose-pre:px-0 prose-pre:border prose-pre:border-[#d4d4d4] dark:prose-pre:border-[#404040] prose-code:font-normal prose-a:text-[#5865F2] prose-a:no-underline prose-a:hover:text-[#3d48c3] dark:prose-a:hover:text-[#7782fa] mx-auto max-w-screen-xl break-words [&_code_span:last-of-type:empty]:hidden [&_div[align='center']_p_a+a]:ml-2"
        : "prose prose-neutral dark:prose-invert prose-h1:mb-2 prose-h1:mt-4 prose-a:[&>img]:inline-block prose-a:[&>img]:m-0 prose-a:[&>img[height='44']]:h-11 prose-p:my-2 prose-pre:py-3 prose-pre:rounded-sm prose-pre:px-0 prose-pre:border prose-pre:border-[#d4d4d4] dark:prose-pre:border-[#404040] prose-code:font-normal prose-a:text-[#5865F2] prose-a:no-underline prose-a:hover:text-[#3d48c3] dark:prose-a:hover:text-[#7782fa] mx-auto max-w-screen-xl px-6 py-6 break-words [&_code_span:last-of-type:empty]:hidden [&_div[align='center']_p_a+a]:ml-2";

    return (
        <div className={cn(className, providedClassName)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    pre({ children }) {
                        if (typeof children === "object" && children !== null && "props" in children) {
                            const { className, children: code } = children.props as PropsWithChildren<{
                                className?: string;
                            }>;
                            const match = /language-(\w+)/.exec(className || "");
                            const lang = match?.[1] || "txt";

                            return (
                                <Scrollbars defer key={`${lang}-${String(code)}`}>
                                    <SyntaxHighlighter
                                        className="min-w-max [&>pre]:my-2 bg-[#121214]"
                                        code={String(code).replace(/\n$/, "")}
                                        lang={lang}
                                    />
                                </Scrollbars>
                            );
                        }

                        return <pre>{children}</pre>;
                    },
                    code({ children }) {
                        return (
                            <code className="bg-zinc-950 text-zinc-400 border border-zinc-700 px-1 font-mono text-sm rounded">
                                {children}
                            </code>
                        );
                    },
                    a({ href, children }) {
                        if (!href) return children;

                        return (
                            <Link
                                prefetch={false}
                                href={href}
                                target={href.startsWith("/docs") ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                className="text-blue-500 underline"
                            >
                                {children}
                            </Link>
                        );
                    },
                    img(props) {
                        return <MarkdownImage {...props} />;
                    },
                }}
            >
                {String(children)}
            </ReactMarkdown>
        </div>
    );
}
