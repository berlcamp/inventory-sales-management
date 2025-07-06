'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { SalesOrderItem } from '@/types'
import { format, parseISO, startOfWeek, subMonths } from 'date-fns'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import LoadingSkeleton from './LoadingSkeleton'
import Php from './Php'
import { Button } from './ui/button'

interface LowStockProductType {
  name: string
  current_quantity: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any
}

interface DashboardMetrics {
  totalCostValue: number
  totalPriceValue: number
  TodaySales: number
  totalSales: number
  totalSalesOrders: number
  totalPurchases: number
  outstandingPayments: number
  lowStockProducts: LowStockProductType[] | [] | null
  bestSellingProducts: { name: string; quantity: number }[]
}

interface WeeklySales {
  week: string
  total: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [showAllLowStock, setShowAllLowStock] = useState(false)

  const [salesData, setSalesData] = useState<WeeklySales[]>([])

  useEffect(() => {
    const fetchMetrics = async () => {
      const today = new Date().toISOString().split('T')[0]

      const [
        productStocks,
        todaySales,
        salesChartResponse,
        salesRes,
        purchasesRes,
        lowStockRes,
        bestSellersRes
      ] = await Promise.all([
        supabase
          .from('product_stocks')
          .select('quantity, cost, selling_price, remaining_quantity, missing'),

        supabase.from('sales_orders').select('total_amount').eq('date', today),
        supabase
          .from('sales_orders')
          .select('created_at, total_amount')
          .gte('created_at', subMonths(new Date(), 2).toISOString()),

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

      // Sales charts
      const grouped: Record<string, number> = {}

      if (salesChartResponse.data) {
        for (const row of salesChartResponse.data ?? []) {
          const createdAt = parseISO(row.created_at)
          const weekStart = format(
            startOfWeek(createdAt, { weekStartsOn: 1 }),
            'yyyy-MM-dd'
          )
          grouped[weekStart] =
            (grouped[weekStart] || 0) + (row.total_amount ?? 0)
        }

        // Convert to array sorted by week
        const weeklyData = Object.entries(grouped)
          .map(([week, total]) => ({ week, total }))
          .sort(
            (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
          )

        setSalesData(weeklyData)
      }

      const totalCostValue =
        productStocks.data?.reduce((sum, item) => {
          const remaning_qty = item.remaining_quantity ?? 0
          // const missing = item.missing ?? 0
          const missing = 0
          const cost = item.cost ?? 0

          return sum + (remaning_qty + missing) * cost
        }, 0) || 0

      const totalPriceValue =
        productStocks.data?.reduce((sum, item) => {
          const remaning_qty = item.remaining_quantity ?? 0
          const cost = item.selling_price ?? 0

          return sum + remaning_qty * cost
        }, 0) || 0

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
        totalPriceValue,
        totalCostValue,
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
          <CardTitle>Today&apos;s Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">
            <Php />{' '}
            {metrics.TodaySales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Total Cost of Inventory</CardTitle>
          <CardDescription>Based on purchase cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Php />{' '}
            {metrics.totalCostValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Total Value of Inventory</CardTitle>
          <CardDescription>Based on current price</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Php />{' '}
            {metrics.totalPriceValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-100 dark:bg-black">
        <CardHeader>
          <CardTitle>Total Purchases</CardTitle>
          <CardDescription>Based on purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Php />{' '}
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
          <CardDescription>Collectable on Sales Orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Php />{' '}
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
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sale Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={(val) => format(new Date(val), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `₱ ${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2
                  })}`
                }
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
