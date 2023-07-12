export interface ElementNode {
  type: "node";
  name: string;
  attrs?: Record<string, string>;
  children?: RichTextNode[];
}

export interface TextNode {
  type: "text";
  text: string;
}

export type RichTextNode = ElementNode | TextNode;
