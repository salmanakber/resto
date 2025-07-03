export type ItemStatus = 'pending' | 'fulfilled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  status: ItemStatus;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export type ActionType = 'item_status_change' | 'status_change' | 'order_add' | 'order_delete';

export interface ActionHistoryItem {
  type: ActionType;
  orderId: string;
  previousState: Order | null;
  newState: Order | null;
  timestamp: number;
  itemIndex?: number;
  previousItemStatus?: ItemStatus;
  newItemStatus?: ItemStatus;
} 