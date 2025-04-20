import { supabase } from '@/lib/supabase/client'
import { PurchaseOrder, PurchaseOrderItem } from '@/types'
import { jsPDF } from 'jspdf'

const generatePurchaseOrderPDF = async (item: PurchaseOrder) => {
  const { data } = await supabase
    .from('purchase_orders')
    .select(
      '*,supplier:supplier_id(*),order_items:purchase_order_items(*,product:product_id(name))'
    )
    .eq('id', item.id)
    .single()

  if (!data) return

  const editData: PurchaseOrder = data

  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Purchase Order', 105, 20, { align: 'center' })

  // Supplier Info
  doc.setFontSize(12)
  doc.text(`Supplier: ${editData.supplier?.name}`, 14, 40)
  doc.text(`Date: ${editData.date}`, 14, 50)

  // Add a table header
  const tableStartY = 60
  const tableColumnHeaders = ['Product', 'Quantity', 'Cost', 'Total']
  doc.setFontSize(10)
  doc.text(tableColumnHeaders[0], 14, tableStartY)
  doc.text(tableColumnHeaders[1], 60, tableStartY)
  doc.text(tableColumnHeaders[2], 100, tableStartY)
  doc.text(tableColumnHeaders[3], 140, tableStartY)

  // Draw a line under the header
  doc.line(14, tableStartY + 2, 200, tableStartY + 2)

  // Add the order items in a table format
  const tableRowHeight = 10
  let currentY = tableStartY + 10

  editData.order_items.forEach((item: PurchaseOrderItem) => {
    const { quantity, cost } = item
    doc.text(item.product.name, 14, currentY)
    doc.text(quantity.toString(), 60, currentY)
    doc.text(cost.toFixed(2), 100, currentY)
    doc.text((quantity * cost).toFixed(2), 140, currentY)

    currentY += tableRowHeight
  })

  // Calculate the total amount
  const totalAmount = editData.order_items.reduce(
    (sum: number, item: PurchaseOrderItem) => sum + item.quantity * item.cost,
    0
  )
  doc.setFontSize(12)
  doc.text(`Total Amount: ₱${totalAmount.toFixed(2)}`, 14, currentY + 10)

  // Footer text
  doc.setFontSize(8)
  doc.text('', 105, currentY + 20, {
    align: 'center'
  })

  // Save the PDF
  doc.save(`purchase_order_${editData.po_number}.pdf`)
}
export default generatePurchaseOrderPDF
