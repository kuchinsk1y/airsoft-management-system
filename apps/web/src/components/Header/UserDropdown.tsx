'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserDropdownProps } from '@/interfaces';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserDropdown({ fullName, className = '' }: UserDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      window.dispatchEvent(new CustomEvent('user-logout-request'));
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-2 border border-white hover:bg-gray-800 transition-colors ${className}`}
        >
          <span className="text-white text-sm font-medium">{fullName}</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-full bg-white border border-gray-200 shadow-lg mt-2"
      >
        <DropdownMenuItem
          onClick={() => {
            router.push('/profile');
          }}
          className="flex items-center gap-3 cursor-pointer text-gray-700 hover:bg-gray-100"
        >
          <User className="w-4 h-4 text-red-500" />
          <span>Мій обліковий запис</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-3 cursor-pointer text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Вихід</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
