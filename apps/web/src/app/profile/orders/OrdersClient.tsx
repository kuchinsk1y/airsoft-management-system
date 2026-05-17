'use client';

import { cancelOrder, getOrders } from '@/actions/orders';
import PaginationTeamList from '@/components/MyTeam/PaginationTeamList';
import type { Order, OrderEvent, OrderStatus } from '@/interfaces';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'ОПЛАЧЕНО',
  PAYMENT_ON_SITE: 'ОПЛАТА НА МІСЦІ',
  NEW: 'НОВИЙ',
  PENDING: 'ОЧІКУЄ',
  PAYMENT_FAILED: 'ПОМИЛКА ОПЛАТИ',
  CANCELLED: 'СКАСОВАНО',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PAID: 'bg-green-900/90 border border-green-500 text-green-400',
  PAYMENT_ON_SITE: 'bg-blue-600 border border-blue-500 text-white',
  NEW: 'bg-orange-900/90 border border-orange-500 text-orange-400',
  PENDING: 'bg-orange-900/90 border border-orange-500 text-orange-400',
  PAYMENT_FAILED: 'bg-red-900/90 border border-red-500 text-red-400',
  CANCELLED: 'bg-red-900/90 border border-red-500 text-red-400',
};

function EventItem({ oe }: { oe: OrderEvent }) {
  const date = oe.event?.startDate
    ? new Date(oe.event.startDate).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';
  const text = `Гра: ${oe.event?.name || ''} • ${date}`;
  const isCancelled = oe.status === 'CANCELLED';

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[14px] ${isCancelled ? 'text-[#666] line-through' : 'text-white'}`}
      >
        {text}
      </span>
      {isCancelled && (
        <span className="text-[11px] px-2 py-0.5 rounded bg-red-900/60 text-red-400 border border-red-500/50 uppercase shrink-0">
          Скасовано
        </span>
      )}
    </div>
  );
}

function OrderDescription({ order }: { order: Order }) {
  const hasEvents = (order.events?.length ?? 0) > 0;
  const hasProducts = (order.products?.length ?? 0) > 0;

  const productNames = (order.products ?? [])
    .map((op) => op.product?.name)
    .filter(Boolean)
    .join(', ');
  const equipmentText = productNames
    ? `Прокат спорядження: ${productNames}`
    : null;

  if (!hasEvents && !hasProducts) {
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';
    const fallbackText = orderDate
      ? `Замовлення від ${orderDate}`
      : 'Замовлення';
    return (
      <span className="text-[12px] text-[#999999]">{fallbackText}</span>
    );
  }

  if (hasProducts && !hasEvents) {
    return (
      <span className="text-[12px] text-[#999999]">{equipmentText}</span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {hasEvents &&
        (order.events ?? []).map((oe) => <EventItem key={oe.id} oe={oe} />)}
      {equipmentText && (
        <span className="text-[12px] text-[#999999]">{equipmentText}</span>
      )}
    </div>
  );
}

function ConfirmCancelOrderModal({
  orderId,
  onConfirm,
  onClose,
  isCancelling,
}: {
  orderId: number;
  onConfirm: () => void;
  onClose: () => void;
  isCancelling: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={isCancelling ? undefined : onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-lg font-semibold mb-3">
          Скасувати замовлення?
        </h3>
        <p className="text-[#999] text-sm mb-6">
          Точно хочете скасувати замовлення №{orderId}? Це скасує всю участь у
          іграх та прокат спорядження.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="px-4 py-2 text-[#999] hover:text-white border border-[#2e2e2e] rounded uppercase text-sm font-semibold disabled:opacity-50"
          >
            Ні
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded uppercase text-sm font-semibold disabled:opacity-50"
          >
            {isCancelling ? 'Скасування...' : 'Так'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<
    number | null
  >(null);

  const fetchOrders = () => {
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();
  }, []);

  const handleCancelOrderClick = (orderId: number) => {
    setConfirmCancelOrderId(orderId);
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelOrderId) return;
    setCancellingId(confirmCancelOrderId);
    const result = await cancelOrder(confirmCancelOrderId);
    setCancellingId(null);
    setConfirmCancelOrderId(null);
    if (result.ok) {
      fetchOrders();
    } else {
      alert(result.error);
    }
  };

  const handleCloseModal = () => {
    if (!cancellingId) {
      setConfirmCancelOrderId(null);
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE)),
    [orders.length]
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(start, start + ITEMS_PER_PAGE);
  }, [orders, currentPage]);

  if (isLoading) {
    return (
      <div className="py-10 px-6 text-center text-[#999999] text-sm uppercase">
        Завантаження...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-10 px-6 text-center">
        <p className="text-[#999999] text-lg">У вас немає замовлень</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col ">
      <div className="overflow-x-auto min-w-0 border border-[#2e2e2e]">
        <div className="flex flex-col min-w-[700px]">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(80px,115px)_minmax(0,1fr)_140px_200px_80px] gap-x-12 border-b border-[#2e2e2e] px-4">
            <div className="py-4 text-xs font-semibold text-[#999999] uppercase whitespace-nowrap">
              НОМЕР ЗАМОВЛЕННЯ
            </div>
            <div className="py-4 text-xs font-semibold text-[#999999] uppercase min-w-0 pr-8">
              ПЕРЕЛІК ІГОР ТА ПОСЛУГ
            </div>
            <div className="py-4 text-xs font-semibold text-[#999999] uppercase whitespace-nowrap text-right">
              ВАРТІСТЬ ЗАМОВЛЕННЯ
            </div>
            <div className="py-4 text-xs font-semibold text-[#999999] uppercase whitespace-nowrap text-right pr-4">
              СТАТУС ЗАМОВЛЕННЯ
            </div>
            <div className="py-4 text-xs font-semibold text-[#999999] uppercase whitespace-nowrap text-center">
              ДІЇ
            </div>
          </div>

          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[minmax(80px,115px)_minmax(0,1fr)_140px_200px_80px] gap-x-12 border-b border-[#2e2e2e] px-4"
            >
              <div className="py-4 flex items-center w-full">
                <span className="text-white font-medium text-sm">
                  №{order.id}
                </span>
              </div>
              <div className="py-4 min-w-0 pr-8 flex items-center">
                <OrderDescription order={order} />
              </div>
              <div className="py-4 flex items-center justify-end text-sm">
                <span className="text-white font-medium">{order.total}</span>
              </div>
              <div className="py-4 flex items-center justify-end pr-4">
                <span
                  className={`inline-flex items-center justify-center min-w-[130px] px-4 py-1.5 text-xs font-semibold uppercase rounded ${
                    STATUS_STYLES[order.status]
                  }`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="py-4 flex items-center justify-center">
                {order.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrderClick(order.id)}
                    disabled={cancellingId === order.id}
                    className="p-2 rounded hover:bg-white/10 text-[#999999] hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Скасувати замовлення"
                    aria-label="Скасувати замовлення"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PaginationTeamList
        className="mt-6 mb-8"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {confirmCancelOrderId && (
        <ConfirmCancelOrderModal
          orderId={confirmCancelOrderId}
          onConfirm={handleConfirmCancel}
          onClose={handleCloseModal}
          isCancelling={cancellingId === confirmCancelOrderId}
        />
      )}
    </div>
  );
}
