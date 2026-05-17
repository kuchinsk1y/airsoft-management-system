'use client';

import * as ordersApi from '@/actions/orders';
import type { ServiceOrder, ServiceOrderStatus } from '@/actions/orders';
import Toast, { ToastMessage } from '@/app/components/Toast';
import { Order, OrderStatus, getOrderStatusLabel } from '@/types/orders';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdClose } from 'react-icons/md';
import {
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
  MdKeyboardArrowDown,
  MdSearch,
} from 'react-icons/md';
import LoadingSpinner from '../../components/LoadingSpinner';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import OrderDetailsPanel from './components/OrderDetailsPanel';
import styles from './ListReveal.module.css';
import { useDebounce } from '@/hooks/useDebounce';

type OrderRow =
  | ({ kind: 'order' } & Order)
  | ({ kind: 'service' } & ServiceOrder);

const PAGE_SIZE = 25;

const SERVICE_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  NEW: 'Новий',
  PENDING: 'В роботі',
  COMPLETED: 'Виконано',
  REJECTED: 'Відхилено',
};

const ORDER_STATUS_OPTIONS = [
  'Всі',
  OrderStatus.NEW,
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PAYMENT_ON_SITE,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.CANCELLED,
];

const SERVICE_ONLY_STATUS_OPTIONS: Array<'Всі' | ServiceOrderStatus> = [
  'Всі',
  'NEW',
  'PENDING',
  'COMPLETED',
  'REJECTED',
];

const ALL_STATUS_OPTIONS: Array<'Всі' | OrderStatus | ServiceOrderStatus> = [
  'Всі',
  OrderStatus.NEW,
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PAYMENT_ON_SITE,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.CANCELLED,
  'COMPLETED',
];

const isOrderStatus = (value: string): value is OrderStatus =>
  (Object.values(OrderStatus) as string[]).includes(value);

const isServiceStatus = (value: string): value is ServiceOrderStatus =>
  ['NEW', 'PENDING', 'COMPLETED', 'REJECTED'].includes(value);

const getAllModeStatusMap = (
  status: string,
): {
  orderStatus?: OrderStatus;
  serviceStatus?: ServiceOrderStatus;
} => {
  switch (status) {
    case OrderStatus.NEW:
      return { orderStatus: OrderStatus.NEW, serviceStatus: 'NEW' };
    case OrderStatus.PENDING:
      return { orderStatus: OrderStatus.PENDING, serviceStatus: 'PENDING' };
    case OrderStatus.CANCELLED:
      return { orderStatus: OrderStatus.CANCELLED, serviceStatus: 'REJECTED' };
    case OrderStatus.PAID:
      return { orderStatus: OrderStatus.PAID };
    case OrderStatus.PAYMENT_ON_SITE:
      return { orderStatus: OrderStatus.PAYMENT_ON_SITE };
    case OrderStatus.PAYMENT_FAILED:
      return { orderStatus: OrderStatus.PAYMENT_FAILED };
    case 'COMPLETED':
      return { serviceStatus: 'COMPLETED' };
    case 'REJECTED':
      return { serviceStatus: 'REJECTED' };
    default:
      return {};
  }
};

export default function OrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Всі');
  const [filterType, setFilterType] = useState<string>('Всі');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmOrderId, setDeleteConfirmOrderId] = useState<
    number | null
  >(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );
  const [deleteTargetKind, setDeleteTargetKind] = useState<'order' | 'service'>(
    'order',
  );
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setFilterStatus('Всі');
  }, [filterType]);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const query = debouncedSearch.trim();

        if (filterType === 'Сервіс') {
          const serviceStatus =
            filterStatus !== 'Всі' && isServiceStatus(filterStatus)
              ? filterStatus
              : undefined;
          const services = await ordersApi.fetchServiceOrders({
            status: serviceStatus,
            searchQuery: query || undefined,
          });
          setOrders([]);
          setServiceOrders(services);
          return;
        }

        const orderFilters: {
          status?: OrderStatus;
          searchQuery?: string;
          orderType?: 'products' | 'events' | 'all';
        } = {};

        if (query) {
          orderFilters.searchQuery = query;
        }

        if (filterType === 'Продукти') {
          orderFilters.orderType = 'products';
        } else if (filterType === 'Події') {
          orderFilters.orderType = 'events';
        }

        if (filterStatus !== 'Всі' && isOrderStatus(filterStatus)) {
          orderFilters.status = filterStatus as OrderStatus;
        }

        if (filterType === 'Всі') {
          if (filterStatus !== 'Всі') {
            const statusMap = getAllModeStatusMap(filterStatus);
            const [ordersData, servicesData] = await Promise.all([
              statusMap.orderStatus
                ? ordersApi.fetchOrders({
                    ...orderFilters,
                    status: statusMap.orderStatus,
                  })
                : Promise.resolve([]),
              statusMap.serviceStatus
                ? ordersApi.fetchServiceOrders({
                    status: statusMap.serviceStatus,
                    searchQuery: query || undefined,
                  })
                : Promise.resolve([]),
            ]);
            setOrders(ordersData);
            setServiceOrders(servicesData);
            return;
          }

          const [ordersData, servicesData] = await Promise.all([
            ordersApi.fetchOrders(orderFilters),
            ordersApi.fetchServiceOrders({ searchQuery: query || undefined }),
          ]);
          setOrders(ordersData);
          setServiceOrders(servicesData);
          return;
        }

        const data = await ordersApi.fetchOrders(orderFilters);
        setOrders(data);
        setServiceOrders([]);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Помилка підключення до сервера';
        setLoadError(errorMsg);
        setOrders([]);
        setServiceOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [filterStatus, filterType, debouncedSearch]);

  const rows = useMemo<OrderRow[]>(() => {
    const orderRows: OrderRow[] = orders.map((order) => ({
      ...order,
      kind: 'order',
    }));
    const serviceRows: OrderRow[] = serviceOrders.map((service) => ({
      ...service,
      kind: 'service',
    }));
    return [...orderRows, ...serviceRows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders, serviceOrders]);

  const filteredRows = useMemo(() => {
    return rows.filter((order) => {
      if (filterStatus !== 'Всі') {
        if (filterType === 'Всі') {
          const statusMap = getAllModeStatusMap(filterStatus);
          const allowedStatuses = [
            statusMap.orderStatus,
            statusMap.serviceStatus,
          ].filter(Boolean);
          if (
            !allowedStatuses.includes(
              order.status as OrderStatus | ServiceOrderStatus,
            )
          ) {
            return false;
          }
        } else if (order.status !== filterStatus) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUser =
          order.kind === 'order'
            ? order.user?.email?.toLowerCase().includes(query) ||
              order.user?.fullName?.toLowerCase().includes(query) ||
              order.user?.nickName?.toLowerCase().includes(query) ||
              order.user?.phoneNumber?.toLowerCase().includes(query)
            : order.name.toLowerCase().includes(query) ||
              order.email.toLowerCase().includes(query) ||
              order.phoneNumber.toLowerCase().includes(query);
        const matchesProducts =
          order.kind === 'order'
            ? (order.products ?? []).some((p) =>
                p.product?.name?.toLowerCase().includes(query),
              )
            : false;
        const matchesEvents =
          order.kind === 'order'
            ? (order.events ?? []).some((e) =>
                e.event?.name?.toLowerCase().includes(query),
              )
            : false;
        const matchesServiceText =
          order.kind === 'service'
            ? order.topic.toLowerCase().includes(query) ||
              order.message.toLowerCase().includes(query)
            : false;
        const matchesId = order.id.toString().includes(query);
        if (
          !matchesUser &&
          !matchesProducts &&
          !matchesEvents &&
          !matchesServiceText &&
          !matchesId
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rows, searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      new: rows.filter((o) => o.status === OrderStatus.NEW).length,
      pending: rows.filter((o) => o.status === OrderStatus.PENDING).length,
      paid: orders.filter((o) => o.status === OrderStatus.PAID).length,
      paymentOnSite: orders.filter(
        (o) => o.status === OrderStatus.PAYMENT_ON_SITE,
      ).length,
      paymentFailed: orders.filter(
        (o) => o.status === OrderStatus.PAYMENT_FAILED,
      ).length,
      cancelled: rows.filter(
        (o) => o.status === OrderStatus.CANCELLED || o.status === 'REJECTED',
      ).length,
      totalAmount: orders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [rows, orders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectedService = useMemo(
    () =>
      serviceOrders.find((service) => service.id === selectedServiceId) ?? null,
    [serviceOrders, selectedServiceId],
  );

  const getCustomerName = (order: OrderRow) =>
    order.kind === 'order'
      ? order.user?.fullName?.trim() ||
        order.user?.nickName ||
        order.user?.email ||
        'Невідомий клієнт'
      : order.name || order.email || 'Невідомий клієнт';

  const getOrderTypeLabel = (order: OrderRow) => {
    if (order.kind === 'service') return 'Сервіс';
    const hasProducts = order.products.length > 0;
    const hasEvents = order.events.length > 0;
    if (hasProducts && hasEvents) return 'Змішане';
    if (hasProducts) return 'Продукти';
    if (hasEvents) return 'Події';
    return 'Порожнє';
  };

  const getOrderItemsPreview = (order: OrderRow) => {
    if (order.kind === 'service') {
      return order.topic || order.message || 'Сервісне звернення';
    }

    const productNames = order.products
      .map((item) => item.product?.name?.trim() || '')
      .filter(Boolean);
    const eventNames = order.events
      .map((item) => item.event?.name?.trim() || '')
      .filter(Boolean);
    const names = [...productNames, ...eventNames];

    if (names.length === 0) {
      return 'Склад замовлення не вказано';
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  };

  const formatCompactDate = (date: Date) =>
    new Date(date).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusChipClasses = (status: string) => {
    switch (status) {
      case OrderStatus.NEW:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case OrderStatus.PENDING:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'COMPLETED':
      case OrderStatus.PAID:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case OrderStatus.PAYMENT_ON_SITE:
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'REJECTED':
      case OrderStatus.PAYMENT_FAILED:
      case OrderStatus.CANCELLED:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getAnyStatusLabel = (status: string) => {
    if (isOrderStatus(status)) {
      return getOrderStatusLabel(status as OrderStatus);
    }
    return SERVICE_STATUS_LABELS[status as ServiceOrderStatus] || status;
  };

  const handleStatusChange = useCallback(
    async (orderId: number, status: Order['status']) => {
      if (!orderId || orderId <= 0) {
        addToast('Невірний заказ (id)', 'error');
        return;
      }
      try {
        setIsLoading(true);
        const updatedOrder = await ordersApi.updateOrderStatus(orderId, status);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrder : o)),
        );
        addToast('Статус замовлення оновлено', 'success');
      } catch (err) {
        console.error('Failed to update order status:', err);
        addToast(
          err instanceof Error ? err.message : 'Помилка при оновленні статусу',
          'error',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addToast],
  );

  const handleServiceStatusChange = useCallback(
    async (serviceId: number, status: ServiceOrderStatus) => {
      if (!serviceId || serviceId <= 0) {
        addToast('Невірний id заявки', 'error');
        return;
      }

      try {
        setIsLoading(true);
        const updated = await ordersApi.updateServiceOrderStatus(
          serviceId,
          status,
        );
        setServiceOrders((prev) =>
          prev.map((item) => (item.id === serviceId ? updated : item)),
        );
        addToast('Статус сервісної заявки оновлено', 'success');
      } catch (err) {
        console.error('Failed to update service order status:', err);
        addToast(
          err instanceof Error ? err.message : 'Помилка при оновленні статусу',
          'error',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addToast],
  );

  const handleDelete = useCallback(
    (orderId: number, kind: 'order' | 'service' = 'order') => {
      setDeleteTargetKind(kind);
      setDeleteConfirmOrderId(orderId);
      setDeleteConfirmOpen(true);
    },
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmOrderId || deleteConfirmOrderId <= 0) {
      addToast('Невірний заказ (id)', 'error');
      setDeleteConfirmOpen(false);
      setDeleteConfirmOrderId(null);
      return;
    }
    setIsDeletingOrder(true);
    try {
      if (deleteTargetKind === 'service') {
        await ordersApi.deleteServiceOrder(deleteConfirmOrderId);
        setServiceOrders((prev) =>
          prev.filter((o) => o.id !== deleteConfirmOrderId),
        );
        if (selectedServiceId === deleteConfirmOrderId) {
          setSelectedServiceId(null);
        }
      } else {
        await ordersApi.deleteOrder(deleteConfirmOrderId);
        setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmOrderId));
        if (selectedOrderId === deleteConfirmOrderId) {
          setSelectedOrderId(null);
        }
      }
      addToast('Замовлення видалено', 'success');
    } catch (err) {
      console.error('Failed to delete order:', err);
      addToast(
        err instanceof Error ? err.message : 'Помилка при видаленні замовлення',
        'error',
      );
    } finally {
      setIsDeletingOrder(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmOrderId(null);
      setDeleteTargetKind('order');
    }
  }, [
    deleteConfirmOrderId,
    deleteTargetKind,
    addToast,
    selectedOrderId,
    selectedServiceId,
  ]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setDeleteConfirmOrderId(null);
    setDeleteTargetKind('order');
  }, []);

  const statusOptions =
    filterType === 'Сервіс'
      ? SERVICE_ONLY_STATUS_OPTIONS
      : filterType === 'Всі'
        ? ALL_STATUS_OPTIONS
        : ORDER_STATUS_OPTIONS;
  const typeOptions = ['Всі', 'Продукти', 'Події', 'Сервіс'];

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Замовлення
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Всього</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Нові</p>
          <p className="text-2xl font-bold text-white">{stats.new}</p>
        </div>
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">В роботі</p>
          <p className="text-2xl font-bold text-white">
            {stats.new + stats.pending}
          </p>
        </div>
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Сума</p>
          <p className="text-2xl font-bold text-white">
            {stats.totalAmount.toFixed(2)} грн
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border-2 border-white/10 bg-black/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Статуси:
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
            Очікують <span className="font-semibold">{stats.pending}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
            Оплачені <span className="font-semibold">{stats.paid}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs text-teal-300">
            На місці{' '}
            <span className="font-semibold">{stats.paymentOnSite}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
            Помилка <span className="font-semibold">{stats.paymentFailed}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-500/30 bg-gray-500/10 px-2.5 py-1 text-xs text-gray-300">
            Скасовані <span className="font-semibold">{stats.cancelled}</span>
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30 mb-6">
        <div className="flex items-center gap-2 text-white mb-4">
          <MdFilterList size={20} />
          <h2 className="font-semibold">Фільтри</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <MdSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Пошук по №, email, телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 text-white placeholder-gray-500 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Фільтр по статусу"
              className="w-full appearance-none pr-9 px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'Всі'
                    ? 'Всі статуси'
                    : getAnyStatusLabel(status as string)}
                </option>
              ))}
            </select>
            <MdKeyboardArrowDown
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              size={20}
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Фільтр по типу"
              className="w-full appearance-none pr-9 px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <MdKeyboardArrowDown
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-12 rounded-xl border-2 border-white/10 bg-black/30 text-center">
          <p className="text-gray-400 text-lg">Замовлення не знайдено</p>
          <p className="text-gray-500 text-sm mt-2">
            Спробуйте змінити фільтри
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 border-white/10 bg-black/30 overflow-hidden overflow-y-hidden mb-6 ${styles.containerEnter}`}
        >
          <div className="hidden md:grid grid-cols-[8rem_1.2fr_0.7fr_1.7fr_0.7fr_0.95fr_0.95fr] gap-3 px-4 py-3 border-b border-white/10 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span>Замовлення</span>
            <span>Клієнт</span>
            <span>Тип</span>
            <span>Зміст</span>
            <span>Сума</span>
            <span>Статус</span>
            <span>Дата</span>
          </div>

          <div className="divide-y divide-white/10">
            {paginatedRows.map((order, index) => (
              <button
                key={`${order.kind}-${order.id}`}
                type="button"
                onClick={() => {
                  if (order.kind === 'order') {
                    setSelectedOrderId(order.id);
                    setSelectedServiceId(null);
                  } else {
                    setSelectedServiceId(order.id);
                    setSelectedOrderId(null);
                  }
                }}
                className={`${styles.rowReveal} w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors`}
                style={{ animationDelay: `${Math.min(index * 28, 280)}ms` }}
              >
                <div className="hidden md:grid grid-cols-[8rem_1.2fr_0.7fr_1.7fr_0.7fr_0.95fr_0.95fr] gap-3 items-center">
                  <span
                    className={`text-sm ${order.kind === 'order' ? 'text-white' : 'text-orange-400'} font-semibold`}
                  >
                    #{order.id}
                  </span>
                  <span className="text-sm text-gray-200 truncate">
                    {getCustomerName(order)}
                  </span>
                  <span className="text-xs text-gray-300">
                    {getOrderTypeLabel(order)}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {getOrderItemsPreview(order)}
                  </span>
                  <span className="text-sm text-white font-medium">
                    {order.kind === 'order'
                      ? `${order.total.toFixed(2)} грн`
                      : '—'}
                  </span>
                  <span
                    className={`inline-flex w-fit items-center px-2 py-1 rounded-full text-[11px] border font-semibold whitespace-nowrap ${getStatusChipClasses(order.status)}`}
                  >
                    {getAnyStatusLabel(order.status)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatCompactDate(order.createdAt)}
                  </span>
                </div>

                <div className="md:hidden space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      Замовлення #{order.id}
                    </p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${getStatusChipClasses(order.status)}`}
                    >
                      {getAnyStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {getCustomerName(order)}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {getOrderItemsPreview(order)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getOrderTypeLabel(order)}</span>
                    <span className="text-white font-semibold">
                      {order.kind === 'order'
                        ? `${order.total.toFixed(2)} грн`
                        : '—'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredRows.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 mb-6 px-1">
          <p className="text-gray-400 text-sm order-2 sm:order-1">
            Показано{' '}
            <span className="text-white font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredRows.length)}
            </span>{' '}
            з{' '}
            <span className="text-white font-medium">
              {filteredRows.length}
            </span>
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Попередня сторінка"
            >
              <MdChevronLeft size={20} />
            </button>
            {(() => {
              const pages: (number | '…')[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push('…');
                for (
                  let i = Math.max(2, currentPage - 1);
                  i <= Math.min(totalPages - 1, currentPage + 1);
                  i++
                )
                  pages.push(i);
                if (currentPage < totalPages - 2) pages.push('…');
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === '…' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-gray-600 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-8.5 h-8.5 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-(--color-primary) text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Наступна сторінка"
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        orderId={deleteConfirmOrderId}
        isLoading={isDeletingOrder}
      />

      <OrderDetailsPanel
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        isLoading={isLoading || isDeletingOrder}
        onClose={() => setSelectedOrderId(null)}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {selectedService && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setSelectedServiceId(null)}
            aria-label="Закрити панель сервісної заявки"
          />

          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-xl border-l border-white/10 bg-[#0f0f10] shadow-2xl shadow-black/60">
            <div className="h-full flex flex-col">
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 bg-black/20">
                <div>
                  <p className="text-xs text-gray-400">Сервісна заявка</p>
                  <h2 className="text-xl font-bold text-white">
                    #{selectedService.id}
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    {formatCompactDate(selectedService.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceId(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Закрити"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
                <section className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2 text-sm">
                  <p className="text-gray-400">Ім'я</p>
                  <p className="text-white">{selectedService.name || '—'}</p>
                  <p className="text-gray-400 mt-2">Телефон</p>
                  <p className="text-white">
                    {selectedService.phoneNumber || '—'}
                  </p>
                  <p className="text-gray-400 mt-2">Email</p>
                  <p className="text-white">{selectedService.email || '—'}</p>
                  <p className="text-gray-400 mt-2">Тема</p>
                  <p className="text-white">{selectedService.topic || '—'}</p>
                  <p className="text-gray-400 mt-2">Компанія</p>
                  <p className="text-white">{selectedService.company || '—'}</p>
                  <p className="text-gray-400 mt-2">Повідомлення</p>
                  <p className="text-white whitespace-pre-wrap wrap-break-word">
                    {selectedService.message || '—'}
                  </p>
                </section>
              </div>

              <div className="px-5 py-4 border-t border-white/10 bg-black/25 space-y-3">
                <div className="relative">
                  <select
                    value={selectedService.status}
                    onChange={(event) =>
                      handleServiceStatusChange(
                        selectedService.id,
                        event.target.value as ServiceOrderStatus,
                      )
                    }
                    disabled={isLoading}
                    className="w-full appearance-none pr-9 px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm disabled:opacity-50"
                    aria-label="Оновити статус сервісної заявки"
                  >
                    <option value="NEW">{SERVICE_STATUS_LABELS.NEW}</option>
                    <option value="PENDING">
                      {SERVICE_STATUS_LABELS.PENDING}
                    </option>
                    <option value="COMPLETED">
                      {SERVICE_STATUS_LABELS.COMPLETED}
                    </option>
                    <option value="REJECTED">
                      {SERVICE_STATUS_LABELS.REJECTED}
                    </option>
                  </select>
                  <MdKeyboardArrowDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                    size={20}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedService.id, 'service')}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Видалити заявку
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  );
}
