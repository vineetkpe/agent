import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(content: string): string {
  if (!content) return "";
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "a",
      "img",
      "blockquote"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target"],
  });
}
