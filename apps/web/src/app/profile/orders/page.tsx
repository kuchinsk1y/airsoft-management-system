import OrdersClient from '@/app/profile/orders/OrdersClient';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Мої замовлення | Strike Shop Action',
  canonicalPath: '/profile/orders',
  description: 'Приватна сторінка замовлень користувача.',
});

export default function OrdersPage() {
  return <OrdersClient />;
}
