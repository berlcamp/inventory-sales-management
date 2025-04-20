import { RootState as RootStateType } from '@/store'

export type RootState = RootStateType

export interface User {
  id: string
  name: string
  password: string
  email?: string
  type?: string
  is_active: boolean
  created_at?: string
}

export interface AddUserFormValues {
  name: string
  email: string
  type: string
  is_active: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at?: string
}

export interface Product {
  id: number
  name: string
  sku?: string
  description?: string
  current_cost: number
  current_price: number
  current_quantity: number
  category_id?: number
  category?: Category
  created_at?: string
  stocks?: ProductStock[]
}

export interface ProductCost {
  id: number
  product_id: number
  cost: number
  created_at?: string
}

export interface ProductStock {
  product_stock_id: number
  id: number
  product_id: number
  product: Product
  cost: number
  selling_price: number
  quantity: number
  remaining_quantity: number
  purchase_order_id?: number
  purchase_date: string
  created_at?: string
}

export interface Supplier {
  id: number
  name: string
  contact_number?: string
  address?: string
  created_at?: string
}

export interface AddSupplierFormValues {
  name: string
  contact_number: string
  address: string
}

export type PurchaseOrderStatus = 'draft' | 'completed'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export interface PurchaseOrder {
  id: number
  supplier_id?: number
  status: PurchaseOrderStatus
  total_amount: number
  po_number: string
  payment_status: PaymentStatus
  date: string
  created_at?: string
  completed_at?: string
  order_items: PurchaseOrderItem[]
  supplier: Supplier
  payments: PurchaseOrderPayment[]
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  product_id: number
  product: Product
  quantity: number
  cost: number
}

export interface PurchaseOrderPayment {
  id: number
  purchase_order_id: number
  date: string
  amount: number
  type: 'cash' | 'cheque' | 'bank'
}

export interface Customer {
  id: number
  name: string
  contact_number?: string
  address?: string
  created_at?: string
}

export type DiscountType = 'none' | 'per_product' | 'order_wide'

export interface SalesOrder {
  id: number
  customer_id?: number
  status: 'draft' | 'completed'
  payment_status: 'unpaid' | 'partial' | 'paid'
  so_number: string
  total_amount: number
  discount_type: DiscountType
  discount_value: number
  created_at?: string
  completed_at?: string
  date: string
  customer?: Customer
  order_items: SalesOrderItem[]
  po_number: string
  payments: SalesOrderPayment[]
}

export interface SalesOrderItem {
  id: number
  sales_order_id: number
  product_stock_id: number
  product_stock: ProductStock
  quantity: number
  unit_price: number
  discount: number
  total: number
}

export interface SalesOrderPayment {
  id: number
  date: string
  amount: number
  type: 'cash' | 'cheque' | 'bank'
}
