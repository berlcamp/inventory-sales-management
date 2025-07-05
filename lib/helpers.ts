import { ProductStock, SalesOrderPayment } from '@/types'

export const countAvailableStocks = (stocks: ProductStock[]): number => {
  return stocks.reduce((total, stock) => total + stock.remaining_quantity, 0)
}

export const countAllStocks = (stocks: ProductStock[]): number => {
  return stocks.reduce((total, stock) => total + stock.quantity, 0)
}

export const checkPDC = (payments: SalesOrderPayment[]): boolean => {
  return payments.find((p) => p.type === 'PDC') ? true : false
}
