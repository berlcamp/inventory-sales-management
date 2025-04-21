import { supabase } from '@/lib/supabase/client'
import { PurchaseOrder, PurchaseOrderItem, Settings, User } from '@/types'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'

const generatePurchaseOrderPDF = async (
  editData: PurchaseOrder,
  user: SupabaseUser
) => {
  const { data } = await supabase
    .from('users')
    .select()
    .eq('email', user.email)
    .single()
  const userData: User = data

  const { data: settings } = await supabase
    .from('settings')
    .select()
    .eq('id', 1)
    .single()
  const settingsData: Settings = settings

  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Purchase Order', 105, 20, { align: 'center' })

  let y = 30

  // Supplier Info
  doc.setFontSize(12)
  doc.text(`PO Number: ${editData.po_number}`, 14, y)
  y += 7
  doc.text(`Supplier: ${editData.supplier?.name}`, 14, y)
  y += 7
  doc.text(`Date: ${format(new Date(editData.date), 'MMMM dd, yyyy')}`, 14, y)

  y += 15
  let billingY = y

  // Billing Info
  doc.setFontSize(10)
  doc.text('Billing Address:', 14, y)
  y += 5
  doc.text(`${settingsData.billing_company}`, 14, y)
  y += 5
  const maxWidth = 100 - 14 // x=14 is the starting point, limit to x=100
  const billingAddressText = doc.splitTextToSize(
    settingsData.billing_address,
    maxWidth
  )
  doc.text(billingAddressText, 14, y)
  // Increase y based on how many lines the address took
  y += billingAddressText.length * 5
  doc.text(`${settingsData.billing_contact_number}`, 14, y)

  doc.text('Shipping Address:', 120, billingY)
  billingY += 5
  doc.text(`${settingsData.shipping_company}`, 120, billingY)
  billingY += 5
  const shippingAddressText = doc.splitTextToSize(
    settingsData.shipping_address,
    maxWidth
  )
  doc.text(shippingAddressText, 120, billingY)
  // Increase y based on how many lines the address took
  billingY += shippingAddressText.length * 5
  doc.text(`${settingsData.shipping_contact_number}`, 120, billingY)

  // Add a table header
  const tableStartY = y + 10
  const tableColumnHeaders = ['Product', 'Quantity', 'Cost', 'Total']
  doc.setFontSize(10)
  doc.text(tableColumnHeaders[0], 14, tableStartY)
  doc.text(tableColumnHeaders[1], 120, tableStartY)
  doc.text(tableColumnHeaders[2], 140, tableStartY)
  doc.text(tableColumnHeaders[3], 160, tableStartY)

  // Draw a line under the header
  doc.line(14, tableStartY + 2, 200, tableStartY + 2)

  // Add the order items in a table format
  const tableRowHeight = 5
  let currentY = tableStartY + 10

  editData.order_items.forEach((item: PurchaseOrderItem) => {
    const { quantity, cost } = item
    doc.text(item.product.name, 14, currentY)
    doc.text(quantity.toString(), 120, currentY)
    doc.text(cost.toFixed(2), 140, currentY)
    doc.text((quantity * cost).toFixed(2), 160, currentY)

    currentY += tableRowHeight
  })

  // Calculate the total amount
  const totalAmount = editData.order_items.reduce(
    (sum: number, item: PurchaseOrderItem) => sum + item.quantity * item.cost,
    0
  )

  currentY += 10
  doc.setFontSize(12)
  doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, 14, currentY)

  // Footer text
  currentY += 20
  doc.text('Prepared By: ', 140, currentY, {
    align: 'left'
  })
  currentY += 10
  doc.text(`${userData.name}`, 140, currentY, {
    align: 'left'
  })

  // Save the PDF
  doc.save(`purchase_order_${editData.po_number}.pdf`)
}
export default generatePurchaseOrderPDF
