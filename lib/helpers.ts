import { ProductStock } from '@/types'

export const countAvailableStocks = (stocks: ProductStock[]): number => {
  return stocks.reduce((total, stock) => total + stock.remaining_quantity, 0)
}

export const countAllStocks = (stocks: ProductStock[]): number => {
  return stocks.reduce((total, stock) => total + stock.quantity, 0)
}
