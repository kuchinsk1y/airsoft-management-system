import { IconProps } from '@/interfaces';

const OrganizerIcon = ({ className }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path d="M2 14V6L8 2L14 6V14H10V10H6V14H2Z" fill="white" />
    </svg>
  );
};

export default OrganizerIcon;
