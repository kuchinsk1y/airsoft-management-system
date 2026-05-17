import type { CartItem, CartState, CartStore, Event, Product } from '@/interfaces';
import { create } from 'zustand';

const MAX_QUANTITY = 99;

const getCartKey = (userId: number | null): string => {
  return userId ? `cart:user:${userId}` : 'cart:none';
};

const loadCartFromStorage = (userId: number | null): CartState | null => {
  if (typeof window === 'undefined' || userId === null) return null;

  try {
    const raw = localStorage.getItem(getCartKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.items)) return null;

    const validItems = parsed.items.filter(
      (item: unknown): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'quantity' in item &&
        'price' in item &&
        (('productId' in item && 'product' in item) || ('eventId' in item && 'event' in item)),
    );

    return {
      userId: parsed.userId ?? userId,
      items: validItems,
      isOpen: false,
    };
  } catch {
    return null;
  }
};

const saveCartToStorage = (userId: number | null, items: CartItem[]) => {
  if (typeof window === 'undefined' || userId === null) return;
  try {
    localStorage.setItem(getCartKey(userId), JSON.stringify({ userId, items }));
  } catch {}
};

const updateAndSave = (
  set: (state: Partial<CartState>) => void,
  get: () => CartStore,
  updates: Partial<CartState>,
) => {
  const { userId } = get();
  set(updates);
  if (userId !== null) {
    saveCartToStorage(userId, updates.items ?? get().items);
  }
};

export const useCartStore = create<CartStore>((set, get) => ({
  userId: null,
  items: [],
  isOpen: false,

  openCart: () => {
    set({ isOpen: true });
  },

  closeCart: () => {
    set({ isOpen: false });
  },

  switchCartUser: (userId: number | null) => {
    const { userId: currentUserId, items } = get();

    if (currentUserId !== null) {
      saveCartToStorage(currentUserId, items);
    }

    if (typeof window !== 'undefined') {
      if (userId === null) {
        localStorage.removeItem('cart:current-user');
      } else {
        localStorage.setItem('cart:current-user', JSON.stringify(userId));
      }
    }

    const newState = loadCartFromStorage(userId);
    set({
      userId: newState?.userId ?? userId,
      items: newState?.items ?? [],
      isOpen: false,
    });
  },

  addItem: (product: Product, quantity = 1) => {
    const { items, userId } = get();
    if (userId === null) return;

    const validQuantity = Math.max(1, Math.min(quantity, MAX_QUANTITY));
    const existingItem = items.find(item => item.productId === product.id);

    const newItems = existingItem
      ? items.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: Math.min(item.quantity + validQuantity, MAX_QUANTITY) }
            : item,
        )
      : [
          ...items,
          {
            id: `product-${product.id}-${Date.now()}`,
            productId: product.id,
            product,
            quantity: validQuantity,
            price: product.price,
          },
        ];

    updateAndSave(set, get, { items: newItems, isOpen: true });
  },

  addEvent: (event: Event, eventSideId?: number) => {
    const { items, userId } = get();
    if (userId === null) return;

    const sideId =
      eventSideId ??
      (event.sides && event.sides.length > 0 ? event.sides[0].id : undefined);

    if (sideId === undefined) return;

    const existingItem = items.find(item => item.eventId === event.id);

    const newItems = existingItem
      ? items
      : [
          ...items,
          {
            id: `event-${event.id}-${Date.now()}`,
            eventId: event.id,
            eventSideId: sideId,
            event,
            quantity: 1,
            price: event.price,
          },
        ];

    updateAndSave(set, get, { items: newItems, isOpen: true });
  },

  setEventSide: (itemId: string, eventSideId: number) => {
    const { userId } = get();
    if (userId === null) return;

    const newItems = get().items.map((item) => {
      if (item.id !== itemId) return item;
      if (item.eventId == null) return item;
      return { ...item, eventSideId };
    });
    updateAndSave(set, get, { items: newItems });
  },

  removeItem: (itemId: string) => {
    const newItems = get().items.filter(item => item.id !== itemId);
    updateAndSave(set, get, { items: newItems });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const newItems = get().items.map(item =>
      item.id === itemId ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) } : item,
    );
    updateAndSave(set, get, { items: newItems });
  },

  clearCart: () => {
    updateAndSave(set, get, { items: [], isOpen: false });
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));

if (typeof window !== 'undefined') {
  const savedUserId = localStorage.getItem('cart:current-user');
  if (savedUserId) {
    try {
      const parsed = JSON.parse(savedUserId);
      if (typeof parsed === 'number' && !isNaN(parsed)) {
        useCartStore.getState().switchCartUser(parsed);
      }
    } catch {}
  }

  let storageListenerAttached = false;
  const attachStorageListener = () => {
    if (storageListenerAttached) return;
    storageListenerAttached = true;

    window.addEventListener('storage', e => {
      if (!e.key?.startsWith('cart:user:') || !e.newValue) return;

      const currentUserId = useCartStore.getState().userId;
      const storageUserId = parseInt(e.key.replace('cart:user:', ''), 10);

      if (isNaN(storageUserId) || currentUserId !== storageUserId) return;

      try {
        const incoming = JSON.parse(e.newValue);
        if (!incoming || typeof incoming !== 'object') return;
        if (!Array.isArray(incoming.items)) return;

        useCartStore.setState({
          userId: typeof incoming.userId === 'number' ? incoming.userId : currentUserId,
          items: incoming.items,
        });
      } catch {}
    });
  };

  attachStorageListener();
}
