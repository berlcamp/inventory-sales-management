'use client'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { SalesOrderItem } from '@/types'
import { useEffect, useState } from 'react'

interface DashboardMetrics {
  totalSales: number
  totalSalesOrders: number
  totalPurchases: number
  outstandingPayments: number
  lowStockProducts: number
  bestSellingProducts: { name: string; quantity: number }[]
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const today = new Date()
      const firstDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      ).toISOString()
      const lastDay = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).toISOString()

      const [salesRes, purchasesRes, lowStockRes, bestSellersRes] =
        await Promise.all([
          supabase
            .from('sales_orders')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('date', firstDay)
            .lte('date', lastDay),

          supabase
            .from('purchase_orders')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('date', firstDay)
            .lte('date', lastDay),

          supabase.from('products').select('id').lt('current_quantity', 10),

          supabase
            .from('sales_order_items')
            .select(
              '*, product_stock:product_stock_id(*, product:product_id(name))'
            )
        ])

      const totalSales =
        salesRes.data?.reduce((sum, s) => sum + s.total_amount, 0) || 0
      const totalSalesOrders = salesRes.data?.length || 0
      const totalPurchases =
        purchasesRes.data?.reduce((sum, p) => sum + p.total_amount, 0) || 0
      const outstandingPayments = totalSales - (await getTotalSalesPayments())
      const lowStockProducts = lowStockRes.data?.length || 0

      const productSalesMap: Record<
        string,
        { name: string; quantity: number }
      > = {}

      const bestSellers: SalesOrderItem[] | null = bestSellersRes.data
      bestSellers?.forEach((item) => {
        const productId = item.product_stock.product_id
        const productName = item.product_stock.product.name
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = { name: productName, quantity: 0 }
        }
        productSalesMap[productId].quantity += item.quantity
      })
      const bestSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      setMetrics({
        totalSales,
        totalSalesOrders,
        totalPurchases,
        outstandingPayments,
        lowStockProducts,
        bestSellingProducts
      })
    }

    const getTotalSalesPayments = async (): Promise<number> => {
      const res = await supabase.from('sales_order_payments').select('amount')
      return res.data?.reduce((sum, p) => sum + p.amount, 0) || 0
    }

    fetchMetrics()
  }, [])

  if (!metrics) return <div>Loading dashboard...</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
      <Card className="bg-gray-600 text-white">
        <CardContent>Total Sales: ₱{metrics.totalSales.toFixed(2)}</CardContent>
      </Card>
      <Card>
        <CardContent>Sales Orders: {metrics.totalSalesOrders}</CardContent>
      </Card>
      <Card>
        <CardContent>
          Total Purchases: ₱{metrics.totalPurchases.toFixed(2)}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          Outstanding Payments: ₱{metrics.outstandingPayments.toFixed(2)}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          Low Stock Products: {metrics.lowStockProducts}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="font-semibold mb-2">Top 5 Best Selling Products</div>
          <ul className="text-sm">
            {metrics.bestSellingProducts.map((p, i) => (
              <li key={i}>
                {p.name} – {p.quantity} sold
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
