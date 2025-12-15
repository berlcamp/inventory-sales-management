// components/AddItemTypeModal.tsx
"use client";

import { PaymentsModal } from "@/components/PaymentsModal";
import { checkPDC } from "@/lib/helpers";
import { supabase } from "@/lib/supabase/client";
import { RootState } from "@/store";
import { useAppSelector } from "@/store/hook";
import { SalesOrder, SalesOrderItem } from "@/types";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { format } from "date-fns";
import { ChevronDown, PhilippinePeso } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import Php from "./Php";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Always update this on other pages
type ItemType = SalesOrder;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  name: string;
}

export const CustomerOrdersModal = ({
  isOpen,
  onClose,
  customerId,
  name,
}: ModalProps) => {
  //
  const [logs, setLogs] = useState<SalesOrder[] | null>([]);
  const [runningTotal, setRunningTotal] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [modalPaymentOpen, setModalPaymentOpen] = useState(false);

  const user = useAppSelector((state: RootState) => state.user.user);

  useEffect(() => {
    const initForm = async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(
          "*,payments:sales_order_payments(*),order_items:sales_order_items(*,product:product_id(*))"
        )
        .eq("company_id", user?.company_id)
        .eq("customer_id", customerId)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching sales orders:", error);
        return;
      }

      setLogs(data);

      if (data && data.length > 0) {
        const total = data.reduce((sum, order) => {
          const orderTotal = (order.order_items || []).reduce(
            (itemSum: number, item: SalesOrderItem) => {
              return itemSum + (item.total || 0);
            },
            0
          );
          return sum + orderTotal + (order.other_charges_amount || 0);
        }, 0);
        setRunningTotal(total);
        const totalReceivable = data.reduce((sum, item) => {
          return (
            sum + (item.payment_status !== "Deposited" ? item.total_amount : 0)
          );
        }, 0);
        setTotalReceivable(totalReceivable);
      } else {
        setRunningTotal(0);
      }
    };

    if (isOpen) {
      initForm();
    }
  }, [customerId, isOpen, user?.company_id]);

  const handleReceivePayment = (item: ItemType) => {
    setSelectedItem(item);
    setModalPaymentOpen(true);
  };

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
        <DialogPanel transition className="app__modal_dialog_panel_lg">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium flex-1">
              Orders of {name}
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="mt-4 text-right font-semibold space-y-2">
              <div className="text-nowrap">
                Total Amount:&nbsp;
                <Php />{" "}
                {runningTotal?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-nowrap">
                Total Receivable:&nbsp;
                <Php />{" "}
                {totalReceivable?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="overflow-x-none pb-20">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">Date</th>
                    <th className="app__th">SO Number</th>
                    <th className="app__th">Products</th>
                    <th className="app__th text-right">Quantity</th>
                    <th className="app__th text-right">Price</th>
                    <th className="app__th text-right">Total Amount</th>
                    <th className="app__th text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((item: ItemType) => (
                    <tr key={item.id} className="app__tr">
                      {/* Date */}
                      <td className="app__td">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? format(new Date(item.date), "MMMM dd, yyyy")
                          : "Invalid date"}
                      </td>

                      {/* SO Number */}
                      <td className="app__td">
                        <span className="font-bold text-nowrap">
                          {item.so_number}
                        </span>
                      </td>

                      {/* Products */}
                      <td className="app__td">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id} className="flex items-center">
                              <span>
                                {oi.product?.name?.length > 70
                                  ? oi.product.name.slice(0, 70) + "…"
                                  : oi.product?.name}
                              </span>
                            </div>
                          ))}
                      </td>

                      {/* Quantity */}
                      <td className="app__td text-right">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id}>{oi.quantity}</div>
                          ))}
                      </td>

                      {/* Price */}
                      <td className="app__td text-right">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id} className="text-nowrap">
                              <Php />{" "}
                              {oi.unit_price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          ))}
                      </td>

                      {/* Total Amount */}
                      <td className="app__td text-right">
                        <span className="font-bold text-nowrap">
                          <Php />{" "}
                          {item.total_amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="app__td text-right">
                        <div className="flex space-x-1">
                          <Menu as="div" className="relative">
                            <MenuButton
                              as={Badge}
                              className={`flex items-center space-x-1 cursor-pointer ${
                                item.payment_status === "partial"
                                  ? "bg-orange-600 text-white"
                                  : item.payment_status === "Cheque"
                                  ? "bg-orange-600 text-white"
                                  : item.payment_status === "Hold"
                                  ? "bg-orange-600 text-white"
                                  : item.payment_status === "Deposited"
                                  ? "bg-green-600 text-white"
                                  : ""
                              }`}
                            >
                              <span>
                                {item.payment_status === "partial"
                                  ? "Partially Paid"
                                  : item.payment_status}
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </MenuButton>

                            <Transition as={Fragment}>
                              <MenuItems className="app__dropdown_items_left">
                                <div className="py-1">
                                  <MenuItem>
                                    <div
                                      onClick={() => handleReceivePayment(item)}
                                      className="app__dropdown_item"
                                    >
                                      <PhilippinePeso className="w-4 h-4" />
                                      <span>View Payments</span>
                                    </div>
                                  </MenuItem>
                                </div>
                              </MenuItems>
                            </Transition>
                          </Menu>
                          {item.payments && checkPDC(item.payments) && (
                            <Badge variant="orange">PDC</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  {logs && logs.length > 0 && (
                    <tr className="app__tr font-bold bg-gray-50">
                      <td colSpan={3} className="app__td text-right">
                        Totals:
                      </td>
                      <td className="app__td text-right">
                        {logs
                          .reduce(
                            (sum, item) =>
                              sum +
                              item.order_items.reduce(
                                (s, oi) => s + oi.quantity,
                                0
                              ),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                      <td className="app__td text-right"></td>
                      <td className="app__td text-right">
                        <Php />{" "}
                        {logs
                          .reduce((sum, item) => sum + item.total_amount, 0)
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                    </tr>
                  )}
                  {logs?.length === 0 && (
                    <tr className="app__tr">
                      <td colSpan={6} className="app__td text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {selectedItem && modalPaymentOpen && (
            <PaymentsModal
              isOpen={modalPaymentOpen}
              editData={selectedItem}
              onClose={() => setModalPaymentOpen(false)}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
