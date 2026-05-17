import { MdLogin, MdPersonAdd, MdLockReset } from 'react-icons/md';
import PageCard from '@/app/components/PageCard';

const pages = [
  {
    id: 'login',
    title: 'Вхід',
    description: 'Сторінка авторизації користувачів.',
    icon: MdLogin,
  },
  {
    id: 'register',
    title: 'Реєстрація',
    description: 'Форма створення нового облікового запису.',
    icon: MdPersonAdd,
  },
  {
    id: 'reset-password',
    title: 'Відновлення паролю',
    description: 'Процес скидання та зміни паролю.',
    icon: MdLockReset,
  },
];

export default function FunctionalPagesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 tracking-[-0.033em] text-white">
          Функціональні сторінки
        </h1>
        <p className="text-gray-400 text-base">
          Налаштування функціональних елементів сайту.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <PageCard
            key={page.id}
            id={page.id}
            title={page.title}
            description={page.description}
            icon={page.icon}
            href={`/pages/functional/${page.id}`}
          />
        ))}
      </div>
    </div>
  );
}
