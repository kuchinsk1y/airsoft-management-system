import * as React from 'react';
import { EyeClosed } from 'lucide-react';
import { IoMdEye } from "react-icons/io";

import { cn } from '@/utils/cn';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {

    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleClick = () => {
        if (type === 'password') {
           setShowPassword((prev) => !prev);
        }
      }
    

    return (

      <div className='relative'>
        {type === 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={handleClick}>
            {!showPassword ? <EyeClosed color='#7f8084' size={20} /> : <IoMdEye color='#7f8084' size={20} />}
          </div>  
        )}
        <input
          type={inputType}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
