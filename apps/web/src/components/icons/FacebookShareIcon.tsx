import { IconProps } from '@/interfaces';

export default function FacebookShareIcon({ className }: IconProps) {
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
        d="M11.4095 6.13522H9.25195V4.72016C9.25195 4.18874 9.60416 4.06484 9.85223 4.06484C10.0997 4.06484 11.3748 4.06484 11.3748 4.06484V1.72861L9.27791 1.72043C6.95015 1.72043 6.42042 3.46287 6.42042 4.57792V6.13522H5.07422V8.54258H6.42042C6.42042 11.6321 6.42042 15.3546 6.42042 15.3546H9.25195C9.25195 15.3546 9.25195 11.5954 9.25195 8.54258H11.1626L11.4095 6.13522Z"
        fill="currentColor"
      />
    </svg>
  );
}
