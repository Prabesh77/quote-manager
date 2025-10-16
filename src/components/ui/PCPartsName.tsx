import React from 'react';
import { Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface PCPartsNameProps {
  pcParts: string;
}

const PCPartsName: React.FC<PCPartsNameProps> = ({ pcParts }) => {
  if (!pcParts) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          title="View PartsCheck parts list"
        >
          <Settings className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">PartsCheck Parts</h4>
          <ul className="space-y-1 max-h-60 overflow-y-auto">
            {pcParts.split(',').map((part, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="text-gray-700">{part.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PCPartsName;

