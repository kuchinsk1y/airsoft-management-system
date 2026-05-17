import {CircleCheckBig} from 'lucide-react';

interface SuccessIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function SuccessIcon({className, size, color}: SuccessIconProps) {
  const iconColor = color || 'green';
  const iconSize = size || 48;
  return (
    <div className={className}>
      <CircleCheckBig size={iconSize} color={iconColor}/>
    </div>
  );
}