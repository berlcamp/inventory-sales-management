import { supabase } from '@/lib/supabase/client'
import { SalesOrder, User } from '@/types'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'

const PrintClaimSlip = async (editData: SalesOrder, user: SupabaseUser) => {
  const doc = new jsPDF()

  const { data } = await supabase
    .from('users')
    .select()
    .eq('email', user.email)
    .single()
  const userData: User = data

  // Title
  doc.setFontSize(18)
  doc.text('Claim Slip', 105, 20, { align: 'center' })

  let y = 30

  // Sales Order Info
  doc.setFontSize(12)
  doc.text(`Sales Order No: ${editData.so_number}`, 14, y)
  y += 7
  doc.text(`Customer: ${editData.customer?.name}`, 14, y)
  y += 7
  doc.text(`Date: ${format(new Date(editData.date), 'MMMM dd, yyyy')}`, 14, y)

  // Add a table header
  const tableStartY = y + 10
  const tableColumnHeaders = [
    'Product',
    'Quantity',
    'Price',
    'Discount',
    'Total'
  ]
  doc.setFontSize(10)
  doc.text(tableColumnHeaders[0], 14, tableStartY)
  doc.text(tableColumnHeaders[1], 100, tableStartY)
  doc.text(tableColumnHeaders[2], 120, tableStartY)
  doc.text(tableColumnHeaders[2], 140, tableStartY)
  doc.text(tableColumnHeaders[3], 160, tableStartY)

  // Draw a line under the header
  doc.line(14, tableStartY + 2, 200, tableStartY + 2)

  // Add the order items in a table format
  const tableRowHeight = 5
  let currentY = tableStartY + 10

  editData.order_items.forEach((item) => {
    const { quantity, unit_price, discount } = item
    doc.text(item.product_stock?.product?.name, 14, currentY)
    doc.text(quantity.toString(), 100, currentY)
    doc.text(unit_price.toFixed(2), 120, currentY)
    doc.text(discount.toFixed(2), 140, currentY)
    doc.text((quantity * unit_price - discount).toFixed(2), 160, currentY)

    currentY += tableRowHeight
  })

  // Calculate the total amount
  const totalAmount = editData.order_items.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price - item.discount),
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
  doc.save(`claim_slip_${editData.so_number}.pdf`)
}
export default PrintClaimSlip
