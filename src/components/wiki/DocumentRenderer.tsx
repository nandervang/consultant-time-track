import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github.css';
import '@/styles/markdown.css';

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
        "markdown-content prose prose-lg max-w-none",
        "prose-headings:font-bold prose-headings:tracking-tight",
        "prose-p:text-gray-700 dark:prose-p:text-gray-300",
        "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
        variant === 'compact' && "prose-compact",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Enhanced heading styles with better hierarchy and section spacing
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-12 first:mt-0 pb-2 border-b-2 border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-10 pb-1 border-b border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-8" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-6" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-5" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mt-4 uppercase tracking-wider" {...props}>
              {children}
            </h6>
          ),
          // Tighter paragraph spacing within sections
          p: ({ children, ...props }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-5 mt-1 leading-normal text-base" {...props}>
              {children}
            </p>
          ),
          // Tighter list spacing within sections, more space between sections
          ul: ({ children, ...props }) => (
            <ul className="mb-5 space-y-1 pl-0 list-none" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-5 space-y-1 pl-0 list-none markdown-ordered-list" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li 
              className="text-gray-700 dark:text-gray-300 leading-snug pl-8 relative markdown-list-item"
              {...props}
            >
              <span className="absolute left-2 top-1 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 markdown-bullet"></span>
              <div className="min-h-[1.2rem]">
                {children}
              </div>
            </li>
          ),
          // Enhanced blockquote with better section spacing
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 pl-6 py-4 my-8 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent italic rounded-r-lg" 
              {...props}
            >
              <div className="text-gray-700 dark:text-gray-300">
                {children}
              </div>
            </blockquote>
          ),
          // Enhanced code styling
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code 
                  className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm font-mono text-pink-600 dark:text-pink-400 border" 
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                className="block bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm font-mono overflow-x-auto border" 
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg overflow-x-auto mb-8 border shadow-sm" {...props}>
              {children}
            </pre>
          ),
          // Enhanced links
          a: ({ children, href, ...props }) => (
            <a 
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-800 dark:hover:decoration-blue-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          // Enhanced images
          img: ({ src, alt, ...props }) => (
            <div className="my-8">
              <img 
                src={src} 
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-lg border"
                {...props}
              />
              {alt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center italic">
                  {alt}
                </p>
              )}
            </div>
          ),
          // Enhanced tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-8 rounded-lg border shadow-sm">
              <table className="min-w-full border-collapse bg-white dark:bg-gray-800" {...props}>
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
            <th className="border-b border-gray-300 dark:border-gray-600 px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </td>
          ),
          // Enhanced horizontal rule with more section spacing
          hr: ({ ...props }) => (
            <div className="my-12 flex items-center justify-center">
              <hr className="flex-1 border-gray-300 dark:border-gray-600" {...props} />
              <div className="mx-4 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <hr className="flex-1 border-gray-300 dark:border-gray-600" />
            </div>
          ),
          // Enhanced strong/bold text
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </strong>
          ),
          // Enhanced emphasis/italic text
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-200" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
