// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { countAllStocks } from '@/lib/helpers'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addList } from '@/store/stocksSlice'
import { Product, ProductStock } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { StocksList } from './StocksList'

// Always update this on other pages
type ItemType = Product

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: ItemType
}

export const StocksModal = ({ editData, onClose, isOpen }: ModalProps) => {
  //
  const dispatch = useAppDispatch()
  const [stocks, setStocks] = useState<ProductStock[] | null>([])

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('product_stocks')
        .select('*,purchase_order:purchase_order_id(po_number)')
        .eq('product_id', editData?.id)

      if (error) {
        console.error(error)
      } else {
        setStocks(data)
        // Update the list of suppliers in Redux store
        dispatch(addList(data))
      }
    }

    fetchData()
  }, [dispatch, editData, isOpen])

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-40 focus:outline-none"
      onClose={() => {}}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      {/* Centered panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel transition className="app__modal_dialog_panel">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium flex-1">
              {editData.name}
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="mt-4 text-right">
              Total Available Stocks: &nbsp;
              <span className="font-bold">
                {editData.current_quantity}
                {stocks && (
                  <span>
                    {' '}
                    out of <span>{countAllStocks(stocks)}</span>
                  </span>
                )}
              </span>
            </div>
            {/* Pass Redux data to List Table */}
            <StocksList />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
