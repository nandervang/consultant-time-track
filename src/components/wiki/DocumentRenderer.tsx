import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github.css';

interface DocumentRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function DocumentRenderer({ 
  content, 
  className,
  variant = 'default' 
}: DocumentRendererProps) {
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none",
        variant === 'compact' && "prose-compact",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom component overrides
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic" 
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code 
                  className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400" 
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" 
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4" {...props}>
              {children}
            </pre>
          ),
          a: ({ children, href, ...props }) => (
            <a 
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt}
              className="max-w-full h-auto rounded-lg shadow-sm my-4"
              {...props}
            />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-700" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </td>
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 border-gray-300 dark:border-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
