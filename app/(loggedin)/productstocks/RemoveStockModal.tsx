"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { useAppDispatch } from "@/store/hook";
import { updateList } from "@/store/listSlice";
import { ProductStock } from "@/types";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type RemoveStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProductStock | null; // pass selected ProductStock
};

type RemoveStockFormType = {
  remove_quantity: number;
  reason: "damage" | "missing" | "expired" | "transfer";
  remarks?: string;
};

export const RemoveStockModal = ({
  isOpen,
  onClose,
  selectedItem,
}: RemoveStockModalProps) => {
  //

  const dispatch = useAppDispatch();

  const removeForm = useForm<RemoveStockFormType>({
    defaultValues: {
      remove_quantity: 1,
      reason: "damage",
      remarks: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    removeForm.reset({
      remove_quantity: 1,
      reason: "damage",
      remarks: "",
    });
  }, [removeForm, isOpen]);

  const handleRemoveStock = async (values: RemoveStockFormType) => {
    if (!selectedItem) return;
    const removeQty = values.remove_quantity;

    if (removeQty > selectedItem.remaining_quantity) {
      toast.error("Quantity exceeds remaining stock.");
      return;
    }

    try {
      // 1️⃣ Deduct remaining_quantity
      const remainingQty = selectedItem.remaining_quantity - removeQty;
      const { error: updateError } = await supabase
        .from("product_stocks")
        .update({
          remaining_quantity: remainingQty,
        })
        .eq("id", selectedItem.id);

      if (updateError) throw updateError;

      dispatch(
        updateList({
          ...selectedItem,
          remaining_quantity: remainingQty,
          id: selectedItem.id,
        })
      );

      toast.success("Stock removed successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove stock.");
    }
  };

  return (
    <Dialog open={isOpen} as="div" className="relative z-50" onClose={() => {}}>
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="app__modal_dialog_panel_sm">
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              Remove Stock
            </DialogTitle>
          </div>

          <div className="app__modal_dialog_content">
            <Form {...removeForm}>
              <form onSubmit={removeForm.handleSubmit(handleRemoveStock)}>
                <div className="grid gap-4 mt-2">
                  {/* Quantity */}
                  <FormField
                    control={removeForm.control}
                    name="remove_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity to Remove</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            max={selectedItem?.remaining_quantity || 1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reason */}
                  <FormField
                    control={removeForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue="damage"
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="damage">Damage</SelectItem>
                              <SelectItem value="missing">Missing</SelectItem>
                              <SelectItem value="transfer">
                                Transfer to Branch
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional Remarks */}
                  <FormField
                    control={removeForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional note" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="app__modal_dialog_footer mt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Remove Stock</Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
