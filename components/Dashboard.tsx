'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { SalesOrderItem } from '@/types'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import LoadingSkeleton from './LoadingSkeleton'
import { Button } from './ui/button'

interface LowStockProductType {
  name: string
  current_quantity: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any
}

interface DashboardMetrics {
  TodaySales: number
  totalSales: number
  totalSalesOrders: number
  totalPurchases: number
  outstandingPayments: number
  lowStockProducts: LowStockProductType[] | [] | null
  bestSellingProducts: { name: string; quantity: number }[]
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [showAllLowStock, setShowAllLowStock] = useState(false)

  useEffect(() => {
    const fetchMetrics = async () => {
      const today = new Date().toISOString().split('T')[0]

      const [todaySales, salesRes, purchasesRes, lowStockRes, bestSellersRes] =
        await Promise.all([
          supabase
            .from('sales_orders')
            .select('total_amount')
            .eq('date', today),

          supabase.from('sales_orders').select('total_amount'),

          supabase
            .from('purchase_orders')
            .select('total_amount')
            .neq('status', 'draft'),

          supabase
            .from('products')
            .select('name, current_quantity, category:category_id(name)')
            .lt('current_quantity', 10),

          supabase
            .from('sales_order_items')
            .select(
              '*, product_stock:product_stock_id(id, product_id, product:product_id(name))'
            )
        ])
      console.log('salesRes.data', salesRes.data)
      const TodaySales =
        todaySales.data?.reduce((sum, s) => sum + s.total_amount, 0) || 0
      const totalSales =
        salesRes.data?.reduce((sum, s) => sum + s.total_amount, 0) || 0
      const totalSalesOrders = salesRes.data?.length || 0
      const totalPurchases =
        purchasesRes.data?.reduce((sum, p) => sum + p.total_amount, 0) || 0
      const outstandingPayments = totalSales - (await getTotalSalesPayments())
      const lowStockProducts: LowStockProductType[] | [] | null =
        lowStockRes.data

      const productSalesMap: Record<
        string,
        { name: string; quantity: number }
      > = {}

      const bestSellers: SalesOrderItem[] | null = bestSellersRes.data
      bestSellers?.forEach((item) => {
        const productStock = item.product_stock
        const productId = productStock?.product_id
        const productName = productStock?.product?.name
        if (productId && productName) {
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = { name: productName, quantity: 0 }
          }
          productSalesMap[productId].quantity += item.quantity
        }
      })

      const bestSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      setMetrics({
        TodaySales,
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

  const displayedProducts = showAllLowStock
    ? metrics?.lowStockProducts
    : metrics?.lowStockProducts?.slice(0, 5)

  if (!metrics) return <LoadingSkeleton />

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4">
      <Card className="md:col-span-4 bg-gradient-to-r from-green-600 via-blue-400 to-white text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Today&apos;s Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">
            ₱{' '}
            {metrics.TodaySales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{' '}
            {metrics.totalSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSalesOrders}</div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Total Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{' '}
            {metrics.totalPurchases.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{' '}
            {metrics.outstandingPayments.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.lowStockProducts?.length ?? 0}
          </div>
          <div className="mt-6">
            <div className="space-y-2">
              {displayedProducts?.map((p, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.category?.name ?? 'Uncategorized'}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {p.current_quantity}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show All toggle */}
              {metrics.lowStockProducts &&
                metrics.lowStockProducts.length > 5 &&
                !showAllLowStock && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      className="text-sm"
                      onClick={() => setShowAllLowStock(true)}
                    >
                      Show All
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top 10 Best Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.bestSellingProducts}>
              <XAxis dataKey="name" tick={false} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <div className="space-y-2">
              {metrics.bestSellingProducts?.map((p, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm">{p.name}</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{p.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
