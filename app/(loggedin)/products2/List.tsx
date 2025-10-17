'use client'
import { Category, RootState } from '@/types' // Import the RootState type
import { Fragment, useState } from 'react'
import { useSelector } from 'react-redux'
import { StocksList } from './StocksList'

export const List = ({}) => {
  const list = useSelector((state: RootState) => state.list.value)

  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null
  )

  return (
    <div className="overflow-x-none">
      <div className="w-full">
        {/* Header */}
        <div className="grid grid-cols-2 app__thead px-4 py-2 font-semibold text-sm uppercase text-gray-600 border-b">
          <div>Name</div>
          <div></div>
        </div>

        {/* Body */}
        <div>
          {list.map((category: Category) => (
            <Fragment key={category.id}>
              {/* Category Row */}
              <div
                className="app__tr cursor-pointer items-center hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedCategoryId((prev) =>
                    prev === category.id ? null : category.id
                  )
                }
              >
                <div className="app__td py-3">
                  <div className="font-bold text-gray-800">{category.name}</div>
                </div>
              </div>

              {/* Expanded StocksList */}
              {expandedCategoryId === category.id && (
                <div className="bg-gray-50 border-l-2 border-blue-300">
                  <div className="app__td py-3">
                    <StocksList categoryId={category.id} />
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
