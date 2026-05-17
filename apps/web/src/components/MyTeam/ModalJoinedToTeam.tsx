'use client';
import { useEffect } from 'react';
import WarningIcon from '../icons/WarningIcon';
import { Inter } from 'next/font/google';
import { GeneralButton } from '../generics/button/Button';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  display: 'swap',
});

export default function PopupJoinedToTeam({
  onClose,
  text,
  children,
}: {
  onClose?: () => void;
  text?: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 h-screen overflow-y-auto ">
      <div className="flex flex-col gap-6 p-10 max-w-[320px] min991:max-w-100 border border-[#FFFFFF] items-center text-center bg-black mx-5">
        <WarningIcon className="w-12 h-12" />
        <p className={`text-sm  ${inter.className} max-w-70 text-[#FFFFFF]`}>
          {text ?? (
            <>
              Після підтвердження вступу Ви
              <br />
              отримаєте підтвердження на пошту
            </>
          )}
        </p>
        {children ? (
          children
        ) : onClose ? (
          <GeneralButton
            text="ЗРОЗУМІЛО"
            variant="orange-bg"
            className="uppercase w-full max-w-50 min991:max-w-[320px] border-none"
            onClick={onClose}
          />
        ) : null}
      </div>
    </div>
  );
}
