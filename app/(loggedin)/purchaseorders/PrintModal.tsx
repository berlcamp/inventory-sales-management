/* eslint-disable @next/next/no-img-element */
import { Button } from '@/components/ui/button'
import { PurchaseOrder } from '@/types'
import { Dialog, DialogPanel } from '@headlessui/react'
import { format } from 'date-fns'
import { useRef } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  editData: PurchaseOrder
}

const PrintModal = ({ isOpen, onClose, editData }: Props) => {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return

    const printContents = printRef.current.innerHTML
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload()
  }

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {}}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      {/* Centered panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="bg-white max-w-3xl w-full rounded p-6 shadow-xl overflow-y-auto max-h-[90vh]">
          <div ref={printRef} className="text-sm text-black">
            <div className="text-center">
              <img src="/pgc.png" className="mx-auto w-[60%]" alt="PGC Logo" />
            </div>
            <h1 className="text-xl font-bold text-center my-10">
              PURCHASE ORDER
            </h1>

            <div className="grid grid-cols-2 gap-1">
              <div>
                Supplier:{' '}
                <span className="font-bold">{editData.supplier?.name}</span>
              </div>
              <div>
                P.O. No: <span className="font-bold">{editData.po_number}</span>
              </div>
              <div>
                Address:{' '}
                <span className="font-bold">{editData.supplier?.address}</span>
              </div>
              <div>
                Date:{' '}
                <span className="font-bold">
                  {format(new Date(editData.date), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>

            <table className="w-full border border-black text-sm text-left mt-10">
              <thead>
                <tr>
                  <th className="border border-black px-1 py-px text-center">
                    Qty.
                  </th>
                  <th className="border border-black px-1 py-px text-center">
                    Unit
                  </th>
                  <th className="border border-black px-1 py-px text-center">
                    Item Description
                  </th>
                  <th className="border border-black px-1 py-px text-center">
                    Unit Price
                  </th>
                  <th className="border border-black px-1 py-px text-center">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {editData.order_items.map((item, idx) => {
                  const { quantity } = item
                  return (
                    <tr key={idx} className="border-b">
                      <td className="border border-black px-1 py-px text-center">
                        {quantity}
                      </td>
                      <td className="border border-black px-1 py-px text-center">
                        {item?.product?.unit}
                      </td>
                      <td className="border border-black px-1 py-px text-center">
                        {item.product?.name}
                      </td>
                      <td className="border border-black px-1 py-px text-center">
                        {item.cost}
                      </td>
                      <td className="border border-black px-1 py-px text-center">
                        {(item.cost * item.quantity)?.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }
                        )}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8">
              <div className="grid grid-cols-2 gap-1">
                <div>Prepare By:</div>
                <div>Reviewed By:</div>
                <div>
                  <div className="mt-8 font-semibold">
                    Jenie Mae A. Aranzado
                  </div>
                </div>
                <div>
                  <div className="mt-8 font-semibold">Analyn B. Butalid</div>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <div className="grid grid-cols-2 gap-1">
                <div>Approved by:</div>
                <div>Conformed By:</div>
                <div>
                  <div className="mt-8 font-semibold">MARIFE P. LUNGAY</div>
                </div>
                <div>
                  <div className="mt-8">Signature: ____________________</div>
                  <div className="">Supplier: _____________________</div>
                  <div className="">Date: ________________________</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <div className="app__modal_dialog_footer">
              <Button type="button" onClick={onClose} variant="outline">
                Close
              </Button>
              <Button type="button" onClick={handlePrint}>
                Print
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default PrintModal
