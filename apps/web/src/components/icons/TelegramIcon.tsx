import { IconProps } from '@/interfaces';

export default function TelegramIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M15.1465 3.06971L12.9772 13.3C12.8136 14.0221 12.3868 14.2017 11.7802 13.8616L8.47498 11.426L6.88017 12.9599C6.7037 13.1364 6.55605 13.284 6.21592 13.284L6.45336 9.91771L12.5793 4.38218C12.8457 4.14474 12.5216 4.01314 12.1654 4.25061L4.59217 9.01918L1.33183 7.99874C0.622639 7.7773 0.609827 7.28952 1.47942 6.94939L14.232 2.03643C14.8224 1.81502 15.339 2.16796 15.1465 3.06971Z"
        fill="currentColor"
      />
    </svg>
  );
}
