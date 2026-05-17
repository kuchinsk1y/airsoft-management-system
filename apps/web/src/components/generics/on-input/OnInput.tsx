"use client";

import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { OnInputProps } from '@/interfaces';
import { SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';


export default function OnInput({
  onDirtyChange,
  onResults,
  placeholder,
  className,
}: OnInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const onResultsRef = useRef(onResults);

  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    onResultsRef.current(debouncedSearchQuery);
  }, [debouncedSearchQuery]);


  return (
    <div
      className={`relative flex items-center border-b border-white py-4 px-4 min991:px-5 min991:py-6 gap-3 min991:gap-5 ${className}`}
    >
      <SearchIcon className="w-4 h-4 min991:w-5 min991:h-5" />
      <Input
        type="text"
        placeholder={placeholder}
        onChange={(e) => {
          const value = e.currentTarget.value;
          setSearchQuery(value);
          if (onDirtyChange) {
            onDirtyChange(value !== '');
          }
        }}
        className="font-medium uppercase text-sm! min991:text-2xl! placeholder:text-white placeholder:text-left placeholder:text-sm min991:placeholder:text-base min1441:placeholder:text-2xl placeholder:uppercase placeholder:opacity-40 border-0 focus-visible:ring-0 focus-visible:border-0"
      />
    </div>
  );
}
