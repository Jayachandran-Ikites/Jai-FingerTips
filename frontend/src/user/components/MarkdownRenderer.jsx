import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkSmartypants]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        p({ children }) {
          return (
            <p style={{ marginBottom: "1.5em" }} className="text-sm md:text-base">
              {children}
            </p>
          );
        },
        ul({ children }) {
          return (
            <ul className="list-disc pl-6 mb-4">
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol className="list-decimal pl-6 mb-4">
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li className="text-sm md:text-base">
              {children}
            </li>
          );
        },
        hr() {
          return (
            <>
              <hr />
              <br />
            </>
          );
        },
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
