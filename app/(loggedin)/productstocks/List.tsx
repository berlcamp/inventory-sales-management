"use client";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { useAppDispatch } from "@/store/hook";
import { deleteItem } from "@/store/listSlice";
import { ProductStock, RootState } from "@/types";
import { MinusCircle, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { EditStockModal } from "./EditStockModal";
import { RemoveStockModal } from "./RemoveStockModal";

// view table
const table = "product_stocks";

export const List = () => {
  const dispatch = useAppDispatch();
  const list = useSelector((state: RootState) => state.list.value);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRemoveOpen, setModalRemoveOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ProductStock | null>(null);

  const stats = useMemo(() => {
    const totalItems = list.length;
    const totalRemaining = list.reduce(
      (sum, item) => sum + (item.remaining_quantity || 0),
      0
    );
    const inventoryValue = list.reduce(
      (sum, item) => sum + (item.remaining_quantity || 0) * (item.cost || 0),
      0
    );
    return { totalItems, totalRemaining, inventoryValue };
  }, [list]);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", selectedItem.id);
    if (error) {
      if (error.code === "23503")
        toast.error("Selected record cannot be deleted.");
      else toast.error(error.message);
      return;
    }
    toast.success("Successfully deleted!");
    dispatch(deleteItem(selectedItem));
    setIsModalOpen(false);
  };

  return (
    <div className="overflow-x-none space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Tracked SKUs</p>
          <p className="text-lg font-semibold">{stats.totalItems}</p>
        </div>
        <div className="rounded-md border bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Remaining Units</p>
          <p className="text-lg font-semibold">{stats.totalRemaining}</p>
        </div>
        <div className="rounded-md border bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Inventory Value</p>
          <p className="text-lg font-semibold">
            {formatMoney(stats.inventoryValue)}
          </p>
        </div>
      </div>

      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th">Product / Details</th>
            <th className="app__th">Category / Batch</th>
            <th className="app__th">Remaining Stocks</th>
            <th className="app__th">Prices</th>
            <th className="app__th">Purchase Date</th>
            <th className="app__th"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ProductStock) => {
            return (
              <tr key={item.id} className="app__tr">
                {/* Product column: name + manufacturer + manufacturing + expiration */}
                <td className="app__td">
                  <div className="font-semibold">{item.product?.name}</div>
                  <div className="text-[11px] text-gray-500">
                    SKU: {item.product?.sku || "—"} • Unit: {item.product?.unit}
                  </div>
                </td>

                {/* Category column: category + batch # + supplier */}
                <td className="app__td">
                  <div className="text-xs font-semibold">
                    {item.product?.category?.name}
                  </div>
                </td>

                <td className="app__td">{item.remaining_quantity}</td>

                <td className="app__td">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Cost</span>
                      <span className="font-medium">
                        {formatMoney(item.cost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Selling</span>
                      <span className="font-medium">
                        {formatMoney(item.selling_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">HSO</span>
                      <span className="font-medium">
                        {formatMoney(item.hso_price)}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="app__td">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700">
                    {formatDate(item.purchase_date)}
                  </span>
                </td>

                <td className="app__td">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-red-500"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-blue-500"
                      onClick={() => {
                        setSelectedItem(item);
                        setModalEditOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-yellow-500"
                      onClick={() => {
                        setSelectedItem(item);
                        setModalRemoveOpen(true);
                      }}
                    >
                      <MinusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <RemoveStockModal
        isOpen={modalRemoveOpen}
        onClose={() => setModalRemoveOpen(false)}
        selectedItem={selectedItem}
      />

      <EditStockModal
        isOpen={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        selectedItem={selectedItem}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this?"
      />
    </div>
  );
};
