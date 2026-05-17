'use client';
import { fetchMyEquipment } from '@/actions/equipment';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import MatchList from '@/components/Profile/MatchList';
import EquipmentBlock from '@/components/Profile/EquipmentBlock';
import { defaultEquipmentItems } from '@/constants/equipment';
import type { UserEquipmentItem } from '@/constants/equipment';
import { useCallback, useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import EditProfile from '@/components/Profile/EditProfile';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function ProfilePage({
  initialEquipment,
}: {
  initialEquipment?: UserEquipmentItem[];
}) {
  const [isEditing, setIsEditing] = useState(true);
  const [equipment, setEquipment] = useState<UserEquipmentItem[]>(() =>
    Array.isArray(initialEquipment) && initialEquipment.length > 0
      ? initialEquipment
      : defaultEquipmentItems(),
  );

  const loadEquipment = useCallback(async () => {
    const data = await fetchMyEquipment();
    setEquipment(data);
  }, []);

  useEffect(() => {
    if (Array.isArray(initialEquipment) && initialEquipment.length > 0) {
      return;
    }
    void loadEquipment();
  }, [initialEquipment, loadEquipment]);

  return (
    <>
      {isEditing ? (
        <div className={` ${inter.className}`}>
          <ProfileHeader
            onEdit={() => setIsEditing(false)}
            equipment={equipment}
            onEquipmentSaved={loadEquipment}
          />
          <MatchList />
          <div className="mt-2.5 px-2.5 min991:px-0 min991:mt-5">
            <EquipmentBlock equipment={equipment} />
          </div>
        </div>
      ) : (
        <EditProfile onCancel={() => setIsEditing(true)}/>
      )}
    </>
  );
}
