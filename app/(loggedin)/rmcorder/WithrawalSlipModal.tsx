/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import Php from "@/components/Php";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store";
import { useAppSelector } from "@/store/hook";
import { SalesOrder } from "@/types";
import { Dialog, DialogPanel } from "@headlessui/react";
import { format } from "date-fns";
import { useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData: SalesOrder;
}

const WithrawalSlipModal = ({ isOpen, onClose, editData }: Props) => {
  const printRef = useRef<HTMLDivElement>(null);

  const user = useAppSelector((state: RootState) => state.user.user);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Calculate quantity from order_items or use stored value
  const quantityCuM =
    (editData as any).quantity_cu_m ||
    editData.order_items?.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    ) ||
    0;

  // Calculate unit price: if price_per_cu_m is stored, use it; otherwise calculate from total/quantity
  const totalAmount = editData.total_amount || 0;
  const pricePerCuM =
    (editData as any).price_per_cu_m ||
    (quantityCuM > 0 ? totalAmount / quantityCuM : 0);

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
              {user?.company_id === "1" ? (
                <img
                  src="/pgc.png"
                  className="mx-auto w-[60%]"
                  alt="PGC Logo"
                />
              ) : (
                <img
                  src="/cgm.png"
                  className="mx-auto w-[60%]"
                  alt="CGM Logo"
                />
              )}
            </div>
            <h1 className="text-xl font-bold text-center my-10">
              Withrawal Slip
            </h1>

            <div className="grid grid-cols-3 gap-1">
              <div className="col-span-2">W.S No: {editData.so_number}</div>
              <div>
                Date: {format(new Date(editData.date), "MMMM dd, yyyy")}
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
                <tr className="border-b">
                  <td className="border border-black px-1 py-px text-center">
                    {quantityCuM.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    cu.m
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    Ready-Mix
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    <Php />{" "}
                    {pricePerCuM.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border border-black px-1 py-px text-center">
                    <Php />{" "}
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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

            <div className="mt-8 space-y-8">
              <div>Ordered By:</div>
              <div>
                <div className="font-semibold">{editData.customer?.name}</div>
                <div className="italic">Signature over Printed Name</div>
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
  );
};

export default WithrawalSlipModal;
