"use client";

import { useRouter } from 'next/navigation';
import { GeneralButton } from '../generics/button/Button';

export default function OrderBtn({title}: {title: string}) {
  const router = useRouter();
  return (
      <GeneralButton text="Замовити" onClick={()=>router.push(`/workshop/services?topic=${encodeURIComponent(title)}`)}/>
  );
}
