import { CV_API_CONFIG } from '@/config/api';

export function CVAPIStatus() {
  const { baseUrl, useLocalAPI } = CV_API_CONFIG;
  
  return (
    <div className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-gray-100 border">
      <div className={`w-2 h-2 rounded-full ${useLocalAPI ? 'bg-green-500' : 'bg-blue-500'}`} />
      <span className="font-medium">
        CV API: {useLocalAPI ? 'LOCAL' : 'REMOTE'}
      </span>
      <span className="text-gray-600 font-mono text-[10px]">
        {baseUrl.replace('/.netlify/functions', '')}
      </span>
    </div>
  );
}