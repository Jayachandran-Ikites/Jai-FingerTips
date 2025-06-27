import React from 'react';
import ReactMarkdown from 'react-markdown';

// remark plugins
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';

// rehype plugins
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

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
          return <p style={{ marginBottom: '1.5em' }}>{children}</p>;
        },
        // slightly smaller gap for list items
        li({ children }) {
          return <li style={{ marginBottom: '1em' }}>{children}</li>;
        },
        // styled tables (optional)
        table({ children }) {
          return (
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              {children}
            </table>
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
          return <td className="px-6 py-4 whitespace-nowrap">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}