import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import {
    type ApiClass,
    type ApiConstructor,
    type ApiDeclaredItem,
    type ApiDocumentedItem,
    type ApiEntryPoint,
    type ApiEnum,
    type ApiEnumMember,
    type ApiInterface,
    type ApiItem,
    type ApiItemContainerMixin,
    type ApiMethod,
    type ApiMethodSignature,
    type ApiProperty,
    type ApiPropertySignature,
    type ApiTypeAlias,
    type ApiVariable,
    ApiTypeParameterListMixin,
    Excerpt,
    ApiAbstractMixin,
    ApiFunction,
    ApiItemKind,
    ApiModel,
    ApiPackage,
    ApiParameterListMixin,
    ApiProtectedMixin,
    ApiReadonlyMixin,
    ApiStaticMixin,
    ExcerptTokenKind,
    ExcerptToken,
    ApiOptionalMixin,
} from "@microsoft/api-extractor-model";
import { DocNodeKind, SelectorKind, StandardTags } from "@microsoft/tsdoc";
import type {
    DocEscapedText,
    DocNode,
    DocNodeContainer,
    DocDeclarationReference,
    DocPlainText,
    DocLinkTag,
    DocFencedCode,
    DocComment,
} from "@microsoft/tsdoc";
import {
    Meaning,
    type DeclarationReference,
    type ModuleSource,
} from "@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference.js";
import { BuiltinDocumentationLinks } from "../src/lib/docs/builtinLinks";
import { PACKAGES, NPM_USER } from "../src/lib/constants";
import { Event } from "../src/lib/docs/types";

interface Options {
    version: string;
    packageName: string;
    monorepo?: string;
}

function findMemberByKey(entry: ApiEntryPoint, containerKey: string) {
    return entry.tryGetMemberByKey(containerKey);
}

function findMember(entry: ApiEntryPoint, memberName: string | undefined) {
    if (!memberName) {
        return undefined;
    }

    return entry.findMembersByName(memberName)[0];
}

/**
 * Resolves all inherited members (including merged members) of a given parent.
 *
 * @param parent - The parent to resolve the inherited members of.
 * @param predicate - A predicate to filter the members by.
 */
export function resolveMembers<WantedItem extends ApiItem>(
    parent: ApiItemContainerMixin,
    predicate: (item: ApiItem) => item is WantedItem,
) {
    const seenItems = new Set<string>();
    const inheritedMembers = parent.findMembersWithInheritance().items.reduce((acc, item) => {
        if (predicate(item) && !seenItems.has(item.displayName)) {
            acc.push({
                item,
                inherited:
                    item.parent?.containerKey === parent.containerKey
                        ? undefined
                        : (item.parent as ApiItemContainerMixin | undefined),
            });

            seenItems.add(item.displayName);
        }

        return acc;
    }, new Array<{ inherited?: ApiItemContainerMixin | undefined; item: WantedItem }>());

    const mergedMembers = parent
        .getMergedSiblings()
        .filter(sibling => sibling.containerKey !== parent.containerKey)
        .flatMap(sibling => (sibling as ApiItemContainerMixin).findMembersWithInheritance().items)
        .filter(item => predicate(item) && !seenItems.has(item.displayName))
        .map(item => ({
            item: item as WantedItem,
            inherited: item.parent ? (item.parent as ApiItemContainerMixin) : undefined,
        }));

    return [...inheritedMembers, ...mergedMembers];
}

const kindToMeaning = new Map([
    [ApiItemKind.CallSignature, Meaning.CallSignature],
    [ApiItemKind.Class, Meaning.Class],
    [ApiItemKind.ConstructSignature, Meaning.ConstructSignature],
    [ApiItemKind.Constructor, Meaning.Constructor],
    [ApiItemKind.Enum, Meaning.Enum],
    // [ApiItemKind.Event, Meaning.Event],
    [ApiItemKind.Function, Meaning.Function],
    [ApiItemKind.IndexSignature, Meaning.IndexSignature],
    [ApiItemKind.Interface, Meaning.Interface],
    [ApiItemKind.Property, Meaning.Member],
    [ApiItemKind.Namespace, Meaning.Namespace],
    [ApiItemKind.None, Meaning.ComplexType],
    [ApiItemKind.TypeAlias, Meaning.TypeAlias],
    [ApiItemKind.Variable, Meaning.Variable],
]);

function mapMeaningToKind(meaning: Meaning): ApiItemKind {
    return [...kindToMeaning.entries()].find(mapping => mapping[1] === meaning)?.[0] ?? ApiItemKind.None;
}

// function mapKindToMeaning(kind: ApiItemKind): Meaning {
// 	return kindToMeaning.get(kind) ?? Meaning.Variable;
// }

function resolveCanonicalReference(
    canonicalReference: DeclarationReference | DocDeclarationReference,
    apiPackage: ApiPackage | undefined,
) {
    if (
        "source" in canonicalReference &&
        canonicalReference.source &&
        "packageName" in canonicalReference.source &&
        canonicalReference.symbol?.componentPath &&
        canonicalReference.symbol.meaning
    )
        return {
            package: canonicalReference.source.packageName,
            unscopedPackage: canonicalReference.source.unscopedPackageName,
            item: {
                kind: mapMeaningToKind(canonicalReference.symbol.meaning as unknown as Meaning),
                displayName: canonicalReference.symbol.componentPath.component.toString(),
                containerKey: `|${
                    canonicalReference.symbol.meaning
                }|${canonicalReference.symbol.componentPath.component.toString()}`,
                getAssociatedEntryPoint() {
                    return canonicalReference.source as ModuleSource;
                },
            },
            // eslint-disable-next-line unicorn/better-regex
            version: apiPackage?.dependencies?.[canonicalReference.source.packageName]?.replace(/[~^]/, ""),
        };
    else if (
        "memberReferences" in canonicalReference &&
        canonicalReference.memberReferences.length &&
        canonicalReference.memberReferences[0]?.memberIdentifier &&
        canonicalReference.memberReferences[0]?.selector?.selectorKind === SelectorKind.System
    ) {
        const member = canonicalReference.memberReferences[0]!;
        return {
            package: canonicalReference.packageName?.replace(`${NPM_USER}/`, ""),
            item: {
                kind: member.selector!.selector,
                displayName: member.memberIdentifier!.identifier,
                containerKey: `|${member.selector!.selector}|${member.memberIdentifier!.identifier}`,
                members: canonicalReference.memberReferences
                    .slice(1)
                    .map(member => ({ kind: member.kind, displayName: member.memberIdentifier!.identifier! })),
                getAssociatedEntryPoint() {
                    return canonicalReference;
                },
            },
            // eslint-disable-next-line unicorn/better-regex
            version: apiPackage?.dependencies?.[canonicalReference.packageName ?? ""]?.replace(/[~^]/, ""),
        };
    }

    return null;
}

export function memberPredicate(
    item: ApiItem,
): item is ApiMethod | ApiMethodSignature | ApiProperty | ApiPropertySignature {
    return (
        item.kind === ApiItemKind.Property ||
        item.kind === ApiItemKind.PropertySignature ||
        item.kind === ApiItemKind.Method ||
        item.kind === ApiItemKind.MethodSignature
    );
}

export function hasProperties(item: ApiItemContainerMixin) {
    return resolveMembers(item, memberPredicate).some(
        ({ item: member }) => member.kind === ApiItemKind.Property || member.kind === ApiItemKind.PropertySignature,
    );
}

export function hasMethods(item: ApiItemContainerMixin) {
    return resolveMembers(item, memberPredicate).some(
        ({ item: member }) => member.kind === ApiItemKind.Method || member.kind === ApiItemKind.MethodSignature,
    );
}

interface ApiEntryPointLike {
    importPath: string | undefined;
}

interface ApiItemLike {
    containerKey?: string;
    displayName: string;
    getAssociatedEntryPoint?(): ApiEntryPointLike | undefined;
    kind: string;
    members?: readonly ApiItemLike[];
    parent?: ApiItemLike | undefined;
}

function resolveItemURI(item: ApiItemLike, entryPoint?: ApiEntryPoint): string {
    const actualEntryPoint = entryPoint ?? item.getAssociatedEntryPoint?.();
    return `${actualEntryPoint?.importPath ? `${actualEntryPoint.importPath}/` : ""}${
        !item.parent || item.parent.kind === ApiItemKind.EntryPoint
            ? `${item.displayName}:${item.kind}`
            : `${item.parent.displayName}:${item.parent.kind}#${item.displayName}`
    }`;
}

function itemExcerptText(excerpt: Excerpt, apiPackage: ApiPackage, parent?: ApiTypeParameterListMixin) {
    return excerpt.spannedTokens.map(token => {
        if (token.kind === ExcerptTokenKind.Reference) {
            if (token.canonicalReference) {
                const resolved = resolveCanonicalReference(token.canonicalReference, apiPackage);

                if (!resolved) {
                    return {
                        text: token.text,
                    };
                }

                const declarationReference = apiPackage
                    .getAssociatedModel()
                    ?.resolveDeclarationReference(token.canonicalReference, apiPackage);
                const foundItem = declarationReference?.resolvedApiItem ?? resolved.item;

                return {
                    text: token.text,
                    resolvedItem: {
                        kind: foundItem.kind,
                        displayName: foundItem.displayName,
                        containerKey: foundItem.containerKey,
                        uri: resolveItemURI(foundItem),
                        packageName: resolved.package?.replace(`${NPM_USER}/`, ""),
                        version: resolved.version,
                    },
                };
            }

            if (token.text in BuiltinDocumentationLinks) {
                return {
                    text: token.text,
                    href: BuiltinDocumentationLinks[token.text as keyof typeof BuiltinDocumentationLinks],
                };
            }

            if (parent?.typeParameters.some(type => type.name === token.text)) {
                const resolvedParent = resolveCanonicalReference(parent.canonicalReference, apiPackage);
                return {
                    text: token.text,
                    resolvedItem: {
                        kind: "TypeParameter",
                        displayName: token.text,
                        containerKey: `${parent.containerKey}|${token.text}`,
                        uri: `${resolveItemURI(parent)}#${token.text}`,
                        packageName: resolvedParent?.package?.replace(`${NPM_USER}/`, ""),
                    },
                };
            }

            return {
                text: token.text,
            };
        }

        return {
            text: token.text,
        };
    });
}

function itemTsDoc(item: DocNode, apiItem: ApiItem) {
    const createNode = (node: DocNode): any => {
        switch (node.kind) {
            case DocNodeKind.PlainText:
                return {
                    kind: DocNodeKind.PlainText,
                    text: (node as DocPlainText).text,
                };
            case DocNodeKind.EscapedText:
                return {
                    kind: DocNodeKind.PlainText,
                    text: (node as DocEscapedText).decodedText,
                };
            case DocNodeKind.Section:
            case DocNodeKind.Paragraph:
                return (node as DocNodeContainer).nodes.map(node => createNode(node));
            case DocNodeKind.SoftBreak:
                return {
                    kind: DocNodeKind.SoftBreak,
                    text: null,
                };
            case DocNodeKind.LinkTag: {
                const { codeDestination, urlDestination, linkText } = node as DocLinkTag;

                if (codeDestination) {
                    if (
                        !codeDestination.importPath &&
                        !codeDestination.packageName &&
                        codeDestination.memberReferences.length === 1 &&
                        codeDestination.memberReferences[0]!.memberIdentifier
                    ) {
                        const typeName = codeDestination.memberReferences[0]!.memberIdentifier.identifier;

                        return {
                            kind: DocNodeKind.LinkTag,
                            text: typeName,
                        };
                    }

                    const declarationReference = apiItem
                        .getAssociatedModel()
                        ?.resolveDeclarationReference(codeDestination, apiItem);
                    const foundItem = declarationReference?.resolvedApiItem;
                    const resolved = resolveCanonicalReference(codeDestination, apiItem.getAssociatedPackage());

                    if (!foundItem && !resolved) {
                        const itemName = codeDestination.memberReferences[0]?.memberIdentifier?.identifier;

                        if (itemName && itemName in BuiltinDocumentationLinks) {
                            return {
                                kind: DocNodeKind.LinkTag,
                                text: itemName,
                                uri: BuiltinDocumentationLinks[itemName as keyof typeof BuiltinDocumentationLinks],
                            };
                        }

                        return {
                            kind: DocNodeKind.LinkTag,
                            text: itemName ?? null,
                        };
                    }

                    return {
                        kind: DocNodeKind.LinkTag,
                        text: linkText ?? foundItem?.displayName ?? resolved!.item.displayName,
                        uri: resolveItemURI(foundItem ?? resolved!.item),
                        resolvedPackage: {
                            packageName:
                                resolved?.package ??
                                apiItem.getAssociatedPackage()?.displayName.replace(`${NPM_USER}/`, ""),
                            version: resolved?.package
                                ? (apiItem.getAssociatedPackage()?.dependencies?.[resolved.package] ?? null)
                                : null,
                        },
                    };
                }

                if (urlDestination) {
                    return {
                        kind: DocNodeKind.LinkTag,
                        text: linkText ?? urlDestination,
                        uri: urlDestination,
                    };
                }

                return {
                    kind: DocNodeKind.LinkTag,
                    text: null,
                };
            }

            case DocNodeKind.CodeSpan: {
                const { code } = node as DocFencedCode;

                return {
                    kind: DocNodeKind.CodeSpan,
                    text: code,
                };
            }

            case DocNodeKind.FencedCode: {
                const { language, code } = node as DocFencedCode;

                return {
                    kind: DocNodeKind.FencedCode,
                    text: code,
                    language,
                };
            }

            case DocNodeKind.Comment: {
                const comment = node as DocComment;

                const exampleBlocks = comment.customBlocks.filter(
                    block => block.blockTag.tagNameWithUpperCase === StandardTags.example.tagNameWithUpperCase,
                );

                const defaultValueBlock = comment.customBlocks.find(
                    block => block.blockTag.tagNameWithUpperCase === StandardTags.defaultValue.tagNameWithUpperCase,
                );

                const unstableBlock = comment.customBlocks.find(
                    block => block.blockTag.tagNameWithUpperCase === "@UNSTABLE",
                );

                const mixesBlocks = comment.customBlocks.filter(
                    block => block.blockTag.tagNameWithUpperCase === "@MIXES",
                );

                const throwsBlocks = comment.customBlocks.filter(
                    block => block.blockTag.tagNameWithUpperCase === "@THROWS",
                );

                return {
                    kind: DocNodeKind.Comment,
                    deprecatedBlock: comment.deprecatedBlock
                        ? createNode(comment.deprecatedBlock.content)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    summarySection: comment.summarySection
                        ? createNode(comment.summarySection)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    remarksBlock: comment.remarksBlock
                        ? createNode(comment.remarksBlock.content)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    defaultValueBlock: defaultValueBlock
                        ? createNode(defaultValueBlock.content)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    returnsBlock: comment.returnsBlock
                        ? createNode(comment.returnsBlock.content)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    unstableBlock: unstableBlock
                        ? createNode(unstableBlock.content)
                              .flat(1)
                              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
                        : [],
                    exampleBlocks: exampleBlocks
                        .flatMap(block => createNode(block.content).flat(1))
                        .filter((val: any) => val.kind !== DocNodeKind.SoftBreak),
                    seeBlocks: comment.seeBlocks
                        .flatMap(block => createNode(block.content).flat(1))
                        .filter((val: any) => val.kind !== DocNodeKind.SoftBreak),
                    mixesBlocks: mixesBlocks
                        .flatMap(block => createNode(block.content).flat(1))
                        .filter((val: any) => val.kind !== DocNodeKind.SoftBreak),
                    throwsBlocks: throwsBlocks
                        .flatMap(block => createNode(block.content).flat(1))
                        .filter((val: any) => val.kind !== DocNodeKind.SoftBreak),
                };
            }

            default:
                return {};
        }
    };

    return item.kind === DocNodeKind.Paragraph || item.kind === DocNodeKind.Section
        ? (item as DocNodeContainer).nodes
              .flatMap(node => createNode(node))
              .filter((val: any) => val.kind !== DocNodeKind.SoftBreak)
        : createNode(item);
}

function itemInfo(item: ApiDeclaredItem, options: Options) {
    const sourceExcerpt = item.excerpt.text.trim();
    const { sourceURL, sourceLine } = resolveFileUrl(item, options);

    const isStatic = ApiStaticMixin.isBaseClassOf(item) && item.isStatic;
    const isProtected = ApiProtectedMixin.isBaseClassOf(item) && item.isProtected;
    const isReadonly = ApiReadonlyMixin.isBaseClassOf(item) && item.isReadonly;
    const isAbstract = ApiAbstractMixin.isBaseClassOf(item) && item.isAbstract;
    const isOptional = ApiOptionalMixin.isBaseClassOf(item) && item.isOptional;
    const isDeprecated = Boolean(item.tsdocComment?.deprecatedBlock);
    const isExternal = Boolean(sourceLine === undefined);
    const hasSummary = Boolean(item.tsdocComment?.summarySection);

    return {
        kind: item.kind,
        displayName: item.displayName,
        sourceURL,
        sourceLine,
        sourceExcerpt,
        summary: hasSummary ? itemTsDoc(item.tsdocComment!, item) : null,
        isStatic,
        isProtected,
        isReadonly,
        isAbstract,
        isDeprecated,
        isOptional,
        isExternal,
    };
}

function resolveFileUrl(item: ApiDeclaredItem, options: Options) {
    const {
        sourceLocation: { _projectFolderUrl, _fileUrlPath },
    } = item;

    const tag = options.monorepo
        ? encodeURIComponent(`${NPM_USER}/${options.packageName}@${options.version}`)
        : `v${options.version}`;

    return {
        sourceURL: options.monorepo
            ? `${_projectFolderUrl}/tree/${tag}/packages/${options.packageName}/${_fileUrlPath}`
            : `${_projectFolderUrl}/tree/${tag}/${_fileUrlPath}`,
        sourceLine: -1,
    };
}

/**
 * This takes an api item with a parameter list and resolves the names and descriptions of all the parameters.
 *
 * @remarks
 * This is different from accessing `Parameter#name` or `Parameter.tsdocBlockComment` as this method cross-references the associated tsdoc
 * parameter names and descriptions and uses them as a higher precedence to the source code.
 * @param item - The api item to resolve parameter data for
 * @returns An array of parameters
 */
function resolveParameters(item: ApiDocumentedItem & ApiParameterListMixin) {
    return item.parameters.map((param, idx) => {
        const tsdocAnalog =
            item.tsdocComment?.params.blocks[idx] ??
            item
                .getMergedSiblings()
                .find(
                    (paramList): paramList is ApiDocumentedItem & ApiParameterListMixin =>
                        ApiParameterListMixin.isBaseClassOf(paramList) && paramList.overloadIndex === 1,
                )?.tsdocComment?.params.blocks[idx];

        return {
            name: param.tsdocParamBlock?.parameterName ?? tsdocAnalog?.parameterName ?? param.name,
            description: param.tsdocParamBlock?.content ?? tsdocAnalog?.content,
            isOptional: param.isOptional,
            // isRest: param.isRest,
            parameterTypeExcerpt: param.parameterTypeExcerpt,
            // defaultValue: param.defaultValue,
        };
    });
}

function itemTypeParameters(item: ApiTypeParameterListMixin) {
    // {
    //     Name: typeParam.name,
    //     Constraints: <ExcerptText excerpt={typeParam.constraintExcerpt} apiPackage={item.getAssociatedPackage()!} />,
    //     Optional: typeParam.isOptional ? 'Yes' : 'No',
    //     Default: <ExcerptText excerpt={typeParam.defaultTypeExcerpt} apiPackage={item.getAssociatedPackage()!} />,
    //     Description: typeParam.tsdocTypeParamBlock ? (
    //         <TSDoc item={item} tsdoc={typeParam.tsdocTypeParamBlock.content} />
    //     ) : (
    //         'None'
    //     ),
    // }

    return item.typeParameters.map(typeParam => ({
        name: typeParam.name,
        constraintsExcerpt: itemExcerptText(typeParam.constraintExcerpt, item.getAssociatedPackage()!, item),
        isOptional: typeParam.isOptional,
        defaultExcerpt: itemExcerptText(typeParam.defaultTypeExcerpt, item.getAssociatedPackage()!, item),
        description: typeParam.tsdocTypeParamBlock ? itemTsDoc(typeParam.tsdocTypeParamBlock.content, item) : null,
    }));
}

function itemParameters(item: ApiDocumentedItem & ApiParameterListMixin) {
    const params = resolveParameters(item);

    // {
    //     Name: param.isRest ? `...${param.name}` : param.name,
    //     Type: <ExcerptText excerpt={param.parameterTypeExcerpt} apiPackage={item.getAssociatedPackage()!} />,
    //     Optional: param.isOptional ? 'Yes' : 'No',
    //     Description: param.description ? <TSDoc item={item} tsdoc={param.description} /> : 'None',
    // }

    return params.map(param => ({
        name: param.name,
        typeExcerpt: itemExcerptText(
            param.parameterTypeExcerpt,
            item.getAssociatedPackage()!,
            item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
        ),
        isOptional: param.isOptional,
        description: param.description ? itemTsDoc(param.description, item) : null,
        // defaultValue: param.defaultValue,
    }));
}

function itemConstructor(item: ApiConstructor, options: Options) {
    return {
        ...itemInfo(item, options),
        parametersString: parametersString(item),
        parameters: itemParameters(item),
    };
}

function isPropertyLike(item: ApiItem): item is ApiProperty | ApiPropertySignature {
    return item.kind === ApiItemKind.Property || item.kind === ApiItemKind.PropertySignature;
}

function itemProperty(item: ApiItemContainerMixin, options: Options) {
    const members = resolveMembers(item, isPropertyLike);

    return members.map(property => {
        const hasSummary = Boolean(property.item.tsdocComment?.summarySection);

        return {
            ...itemInfo(property.item, options),
            inheritedFrom: property.inherited ? resolveItemURI(property.inherited) : null,
            typeExcerpt: itemExcerptText(
                property.item.propertyTypeExcerpt,
                property.item.getAssociatedPackage()!,
                property.item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
            ),
            summary: hasSummary ? itemTsDoc(property.item.tsdocComment!, property.item) : null,
        };
    });
}

function parametersString(item: ApiDocumentedItem & ApiParameterListMixin) {
    return resolveParameters(item).reduce((prev, cur, index) => {
        if (index === 0) {
            return `${prev}${cur.isRest ? "..." : ""}${cur.isOptional ? `${cur.name}?` : cur.name}`;
        }

        return `${prev}, ${cur.isRest ? "..." : ""}${cur.isOptional ? `${cur.name}?` : cur.name}`;
    }, "");
}

function isMethodLike(item: ApiItem): item is ApiMethod | ApiMethodSignature {
    return (
        item.kind === ApiItemKind.Method ||
        (item.kind === ApiItemKind.MethodSignature && (item as ApiMethod).overloadIndex <= 1)
    );
}

function itemMethod(item: ApiItemContainerMixin, options: Options) {
    const members = resolveMembers(item, isMethodLike);

    const methodItem = (method: {
        inherited?: ApiItemContainerMixin | undefined;
        item: ApiMethod | ApiMethodSignature;
    }) => {
        const hasSummary = Boolean(method.item.tsdocComment?.summarySection);

        return {
            ...itemInfo(method.item, options),
            overloadIndex: method.item.overloadIndex,
            parametersString: parametersString(method.item),
            returnTypeExcerpt: itemExcerptText(
                method.item.returnTypeExcerpt,
                method.item.getAssociatedPackage()!,
                method.item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
            ),
            inheritedFrom: method.inherited ? resolveItemURI(method.inherited) : null,
            typeParameters: itemTypeParameters(method.item),
            parameters: itemParameters(method.item),
            summary: hasSummary ? itemTsDoc(method.item.tsdocComment!, method.item) : null,
        };
    };

    return members.map(method => {
        // const parent = method.item.parent as ApiDeclaredItem;
        const hasOverload =
            method.item
                .getMergedSiblings()
                .filter(sibling => sibling.kind === ApiItemKind.Method || sibling.kind === ApiItemKind.MethodSignature)
                .length > 1;

        const overloads = method.item
            .getMergedSiblings()
            .filter(sibling => sibling.kind === ApiItemKind.Method || sibling.kind === ApiItemKind.MethodSignature)
            .map(sibling => methodItem({ item: sibling as ApiMethod | ApiMethodSignature }));

        return {
            ...methodItem(method),
            overloads: hasOverload ? overloads : [],
        };
    });
}

function itemMembers(item: ApiDeclaredItem & ApiItemContainerMixin, options: Options) {
    const properties = hasProperties(item) ? itemProperty(item, options) : [];
    let methods = hasMethods(item) ? itemMethod(item, options) : [];
    const events: Event[] = [];

    // If this class (or any ancestor) exposes an `on` method, extract it
    // from the `methods` list and create `events` entries from its overloads.
    {
        const onIndex = methods.findIndex(m => m.displayName === "on");
        if (onIndex !== -1) {
            const [onMethod] = methods.splice(onIndex, 1);

            const pushEventFromMethod = (m: any) => {
                const overloads = [m, ...(m.overloads ?? [])];
                const seen = new Set<string>();

                for (const ovl of overloads) {
                    const firstParam = ovl.parameters?.[0];
                    const eventName = firstParam
                        ? Array.isArray(firstParam.typeExcerpt)
                            ? firstParam.typeExcerpt
                                  .map((t: any) => t.text)
                                  .join("")
                                  .trim()
                            : String(firstParam.typeExcerpt)
                        : null;

                    const key = eventName ?? JSON.stringify(ovl.parameters ?? []);
                    if (seen.has(key)) continue;
                    seen.add(key);

                    events.push({
                        ...ovl,
                        kind: "Event",
                        sourceURL: ovl.sourceURL,
                        sourceLine: ovl.sourceURL,
                        displayName: eventName.slice(1, -1) ?? "event",
                        parameters: ovl.parameters ?? [],
                        parametersString: ovl.parametersString ?? "",
                        returnTypeExcerpt: ovl.returnTypeExcerpt ?? null,
                        summary: ovl.summary ?? null,
                        inheritedFrom: ovl.inheritedFrom ?? null,
                        overloadIndex: 1,
                        overloads: [],
                    });
                }
            };

            pushEventFromMethod(onMethod);
        }
    }

    return {
        properties,
        methods,
        events,
    };
}

export function itemHierarchyText({
    item,
    type,
}: {
    readonly item: ApiClass | ApiInterface;
    readonly type: "Extends" | "Implements";
}) {
    if (
        (item.kind === ApiItemKind.Class &&
            (item as ApiClass).extendsType === undefined &&
            (item as ApiClass).implementsTypes.length === 0) ||
        (item.kind === ApiItemKind.Interface && !(item as ApiInterface).extendsTypes)
    ) {
        return null;
    }

    let excerpts: Excerpt[];

    if (item.kind === ApiItemKind.Class) {
        if (type === "Implements") {
            if ((item as ApiClass).implementsTypes.length === 0) {
                return null;
            }

            excerpts = (item as ApiClass).implementsTypes.map(typeExcerpt => typeExcerpt.excerpt);
        } else {
            if (!(item as ApiClass).extendsType) {
                return null;
            }

            excerpts = [(item as ApiClass).extendsType!.excerpt];
        }
    } else {
        if ((item as ApiInterface).extendsTypes.length === 0) {
            return null;
        }

        excerpts = (item as ApiInterface).extendsTypes.map(typeExcerpt => typeExcerpt.excerpt);
    }

    // return (
    // 	<div className="flex flex-col gap-4">
    // 		{excerpts.map((excerpt, idx) => (
    // 			<div className="flex flex-row place-items-center gap-4" key={`${type}-${idx}`}>
    // 				<h3 className="text-xl font-bold">{type}</h3>
    // 				<span className="break-all font-mono space-y-2">
    // 					<ExcerptText excerpt={excerpt} apiPackage={item.getAssociatedPackage()!} />
    // 				</span>
    // 			</div>
    // 		))}
    // 	</div>
    // );

    return excerpts.map(excerpt => ({
        type,
        excerpts: itemExcerptText(
            excerpt,
            item.getAssociatedPackage()!,
            item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
        ),
    }));
}

function itemClass(item: ApiClass, options: Options) {
    const constructor = item.members.find(member => member.kind === ApiItemKind.Constructor) as
        | ApiConstructor
        | undefined;

    return {
        ...itemInfo(item, options),
        extends: itemHierarchyText({ item, type: "Extends" }),
        implements: itemHierarchyText({ item, type: "Implements" }),
        typeParameters: itemTypeParameters(item),
        construct: constructor ? itemConstructor(constructor, options) : null,
        members: itemMembers(item, options),
    };
}

function itemFunction(item: ApiFunction, options: Options) {
    const functionItem = (item: ApiFunction) => ({
        ...itemInfo(item, options),
        overloadIndex: item.overloadIndex,
        typeParameters: itemTypeParameters(item),
        parameters: itemParameters(item),
    });

    const hasOverloads = item.getMergedSiblings().length > 1;
    const overloads = item.getMergedSiblings().map(sibling => functionItem(sibling as ApiFunction));

    return {
        ...functionItem(item),
        overloads: hasOverloads ? overloads : [],
    };
}

function itemInterface(item: ApiInterface, options: Options) {
    return {
        ...itemInfo(item, options),
        extends: itemHierarchyText({ item, type: "Extends" }),
        typeParameters: itemTypeParameters(item),
        members: itemMembers(item, options),
    };
}

function itemUnion(item: Excerpt) {
    const union: ExcerptToken[][] = [];
    let currentUnionMember: ExcerptToken[] = [];
    let depth = 0;
    for (const token of item.spannedTokens) {
        if (token.text.includes("?")) {
            return [item.spannedTokens];
        }

        depth += token.text.split("<").length - token.text.split(">").length;

        if (token.text.trim() === "|" && depth === 0) {
            if (currentUnionMember.length) {
                union.push(currentUnionMember);
                currentUnionMember = [];
            }
        } else if (depth === 0 && token.kind === ExcerptTokenKind.Content && token.text.includes("|")) {
            for (const [idx, tokenpart] of token.text.split("|").entries()) {
                if (currentUnionMember.length && depth === 0 && idx === 0) {
                    currentUnionMember.push(new ExcerptToken(ExcerptTokenKind.Content, tokenpart));
                    union.push(currentUnionMember);
                    currentUnionMember = [];
                } else if (currentUnionMember.length && depth === 0) {
                    union.push(currentUnionMember);
                    currentUnionMember = [new ExcerptToken(ExcerptTokenKind.Content, tokenpart)];
                } else if (tokenpart.length) {
                    currentUnionMember.push(new ExcerptToken(ExcerptTokenKind.Content, tokenpart));
                }
            }
        } else {
            currentUnionMember.push(token);
        }
    }

    if (currentUnionMember.length) {
        union.push(currentUnionMember);
    }

    return union;
}

function itemTypeAlias(item: ApiTypeAlias, options: Options) {
    return {
        ...itemInfo(item, options),
        typeParameters: itemTypeParameters(item),
        unionMembers: itemUnion(item.typeExcerpt).map(member =>
            itemExcerptText(
                new Excerpt(member, { startIndex: 0, endIndex: member.length }),
                item.getAssociatedPackage()!,
                item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
            ),
        ),
    };
}

function itemVariable(item: ApiVariable, options: Options) {
    return {
        ...itemInfo(item, options),
        unionMembers: itemUnion(item.variableTypeExcerpt).map(member =>
            itemExcerptText(
                new Excerpt(member, { startIndex: 0, endIndex: member.length }),
                item.getAssociatedPackage()!,
                item.getHierarchy().find(ApiTypeParameterListMixin.isBaseClassOf),
            ),
        ),
    };
}

function itemEnumMember(item: ApiEnumMember, options: Options) {
    return {
        ...itemInfo(item, options),
        name: item.name,
        initializerExcerpt: item.initializerExcerpt
            ? itemExcerptText(item.initializerExcerpt, item.getAssociatedPackage()!)
            : null,
    };
}

function itemEnum(item: ApiEnum, options: Options) {
    return {
        ...itemInfo(item, options),
        members: item.members.map(member => itemEnumMember(member, options)),
    };
}

function memberKind(member: ApiItem | null, options: Options) {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (member?.kind) {
        case "Class": {
            const classMember = member as ApiClass;
            return itemClass(classMember, options);
        }

        case "Function": {
            const functionMember = member as ApiFunction;
            return itemFunction(functionMember, options);
        }

        case "Interface": {
            const interfaceMember = member as ApiInterface;
            return itemInterface(interfaceMember, options);
        }

        case "TypeAlias": {
            const typeAliasMember = member as ApiTypeAlias;
            return itemTypeAlias(typeAliasMember, options);
        }

        case "Variable": {
            const variableMember = member as ApiVariable;
            return itemVariable(variableMember, options);
        }

        case "Enum": {
            const enumMember = member as ApiEnum;
            return itemEnum(enumMember, options);
        }

        default:
            return null;
    }
}

async function writeSplitDocsToFileSystem({
    entry,
    member,
    packageName,
    tag = "main",
    overrideName,
}: {
    entry?: string;
    member: Record<string, any>;
    overrideName?: string;
    packageName: string;
    tag: string;
}) {
    try {
        (await stat(join(process.cwd(), "docs", packageName, tag, "chunks"))).isDirectory();
    } catch {
        await mkdir(join(process.cwd(), "docs", packageName, tag, "chunks"), { recursive: true });
    }

    await writeFile(
        join(
            process.cwd(),
            "docs",
            packageName,
            tag,
            "chunks",
            `${entry ? `${entry.replaceAll("/", ".")}.` : ""}${
                overrideName ?? `${member.displayName.toLowerCase()}.${member.kind.toLowerCase()}`
            }.api.json`,
        ),
        JSON.stringify(member),
    );
}

export async function generateSplitDocumentation(input: { packageName: string; versions: string[] }[]) {
    for (const { packageName: pkgName, versions } of input) {
        for (const version of versions) {
            const data = `docs/${pkgName}/${version}/docs.api.json`;
            const model = new ApiModel();
            model.addMember(ApiPackage.loadFromJsonFile(data));
            const pkg = model.tryGetPackageByName(pkgName);
            const entries = pkg?.entryPoints;

            if (!entries) {
                continue;
            }

            await writeSplitDocsToFileSystem({
                member: pkg.dependencies ?? [],
                packageName: pkgName,
                tag: version,
                overrideName: "dependencies",
            });

            await writeSplitDocsToFileSystem({
                member: entries.map(entry => ({
                    entryPoint: entry.importPath,
                })),
                packageName: pkgName,
                tag: version,
                overrideName: "entrypoints",
            });

            for (const entry of entries) {
                const members = entry.members
                    .filter(item => {
                        switch (item.kind) {
                            case ApiItemKind.Function:
                                return (item as ApiFunction).overloadIndex === 1;
                            case ApiItemKind.Interface:
                                return !entry.members.some(
                                    innerItem =>
                                        innerItem.kind === ApiItemKind.Class &&
                                        innerItem.displayName === item.displayName,
                                );
                            default:
                                return true;
                        }
                    })
                    .map(item => ({
                        kind: item.kind,
                        name: item.displayName,
                        href: resolveItemURI(item),
                        entry: entry.importPath,
                    }));

                await writeSplitDocsToFileSystem({
                    member: members,
                    packageName: pkgName,
                    tag: version,
                    overrideName: "sitemap",
                    entry: entry.importPath,
                });

                const options: Options = {
                    version,
                    packageName: pkgName,
                    monorepo: PACKAGES.find(p => p.name === pkgName)?.monorepo,
                };

                for (const member of members) {
                    const item = `${member.name}:${member.kind}`;
                    const [memberName, overloadIndex] = decodeURIComponent(item).split(":");

                    // eslint-disable-next-line prefer-const
                    let { containerKey, displayName: name } = findMember(entry, memberName) ?? {};
                    if (name && overloadIndex && !Number.isNaN(Number.parseInt(overloadIndex, 10))) {
                        containerKey = ApiFunction.getContainerKey(name, Number.parseInt(overloadIndex, 10));
                    }

                    const foundMember =
                        memberName && containerKey ? (findMemberByKey(entry, containerKey) ?? null) : null;

                    const returnValue = memberKind(foundMember, options);

                    if (!returnValue) {
                        continue;
                    }

                    await writeSplitDocsToFileSystem({
                        member: returnValue,
                        packageName: pkgName,
                        tag: version,
                        entry: entry.importPath,
                    });
                }
            }
        }
    }
}

if (process.argv[1].includes("chunk-docs")) {
    const packageName = process.argv[2];
    const version = process.argv[3];
    if (!version) {
        console.log("Missing args");
        process.exit(1);
    }

    console.log(`Running chunk-docs on ${packageName}/${version}`);
    generateSplitDocumentation([{ packageName, versions: [version] }]);
}
