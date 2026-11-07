import { HtmlNode } from '@logicflow/core';
export declare class BaseNodeView extends HtmlNode {
    constructor(props: any);
    shouldUpdate(): boolean;
    setHtml(rootEl: any): void;
}
