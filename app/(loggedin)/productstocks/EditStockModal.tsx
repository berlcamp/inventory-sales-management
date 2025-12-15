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
import { supabase } from "@/lib/supabase/client";
import { useAppDispatch } from "@/store/hook";
import { updateList } from "@/store/listSlice";
import { ProductStock } from "@/types";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const table = "product_stocks";

const FormSchema = z.object({
  cost: z.coerce.number().min(0, "Purchase price required"),
  selling_price: z.coerce.number().min(0, "Selling price required"),
  hso_price: z.coerce.number().min(0, "HSO price required"),
  purchase_date: z.string().min(1, "Purchase date required"),
  batch_no: z.string().optional(),
  manufacturer: z.string().optional(),
  date_manufactured: z.string().optional(),
  expiration_date: z.string().optional(),
  remarks: z.string().optional(),
});

type FormType = z.infer<typeof FormSchema>;

export const EditStockModal = ({
  isOpen,
  onClose,
  selectedItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProductStock | null;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      cost: 0,
      selling_price: 0,
      hso_price: 0,
      purchase_date: "",
    },
  });

  useEffect(() => {
    if (selectedItem && isOpen) {
      form.reset({
        cost: selectedItem.cost || 0,
        selling_price: selectedItem.selling_price || 0,
        hso_price: selectedItem.hso_price || 0,
        purchase_date: selectedItem.purchase_date || "",
      });
    }
  }, [selectedItem, isOpen, form]);

  const onSubmit = async (data: FormType) => {
    if (!selectedItem) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const updateData: {
        cost: number;
        selling_price: number;
        hso_price: number;
        purchase_date: string;
      } = {
        cost: data.cost,
        selling_price: data.selling_price,
        hso_price: data.hso_price,
        purchase_date: data.purchase_date,
      };

      const { data: updated, error } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", selectedItem.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      dispatch(
        updateList({ ...selectedItem, ...updated, id: selectedItem.id })
      );
      toast.success("Stock updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(`Failed to update: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {}}
    >
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel transition className="app__modal_dialog_panel_sm">
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              Edit Stock
            </DialogTitle>
          </div>
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Purchase Cost
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Selling Price
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hso_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            HSO Price
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Purchase Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="app__input_standard"
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="app__modal_dialog_footer">
                  <Button type="button" onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
