// src/components/MarkdownRenderer.jsx
import React from "react";
import ReactMarkdown from "react-markdown";

// remark plugins
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";

// rehype plugins
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      // GFM tables/strikethrough/task lists + smart punctuation
      remarkPlugins={[remarkGfm, remarkSmartypants]}
      // raw HTML + syntax-highlight code
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        // one 1.5em gap after each paragraph
        p({ children }) {
          return (
            <p
              style={{ marginBottom: "1.5em" }}
              className="text-sm md:text-base"
            >
              {children}
            </p>
          );
        },
        // slightly smaller gap for list items
        li({ children }) {
          return <li style={{ marginBottom: "1em" }}>{children}</li>;
        },
        // styled tables (optional)
        table({ children }) {
          return (
            <div className="overflow-x-auto max-w-full border-2 border-gray-200 rounded-lg bg-white shadow-md my-4 inline-block">
              <table className="max-w-full divide-y divide-gray-200 mb-4">
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-gray-50">{children}</thead>;
        },
        tbody({ children }) {
          return (
            <tbody className="bg-white divide-y divide-gray-200">
              {children}
            </tbody>
          );
        },
        tr({ children }) {
          return <tr>{children}</tr>;
        },
        th({ children }) {
          return (
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="text-sm px-6 py-4 whitespace-nowrap">{children}</td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
