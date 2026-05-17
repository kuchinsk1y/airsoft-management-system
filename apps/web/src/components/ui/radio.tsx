import { RadioProps } from '@/interfaces';
import * as React from 'react';

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = '', label, checked, ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 lg:gap-3 cursor-pointer ${className}`}>
        <div className="relative w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center">
          <input type="radio" ref={ref} checked={checked} className="sr-only" {...props} />
          {checked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="11" stroke="#FA4616" strokeWidth="2" />
              <circle cx="12" cy="12" r="7.5" fill="#FA4616" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6"
            >
              <circle opacity="0.4" cx="12" cy="12" r="11.5" stroke="white" />
            </svg>
          )}
        </div>
        {label && <span className="uppercase text-white text-xs lg:text-base">{label}</span>}
      </label>
    );
  },
);
Radio.displayName = 'Radio';

export { Radio };
