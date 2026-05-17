import EditProfile from "@/components/Profile/EditProfile";
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Налаштування профілю | Strike Shop Action',
  canonicalPath: '/profile/settings',
  description: 'Приватна сторінка налаштувань профілю.',
});


export default function EditProfilePage() {
  return (
    <EditProfile />
  )
}
