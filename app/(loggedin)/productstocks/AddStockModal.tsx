"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { addItem } from "@/store/listSlice";
import { Product } from "@/types";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const table = "product_stocks";

const FormSchema = z.object({
  product_id: z.coerce.number().min(1, "Product required"),
  quantity: z.coerce.number().min(1, "Quantity required"),
  cost: z.coerce.number().min(0, "Purchase price required"),
  selling_price: z.coerce.number().min(0, "Selling price required"),
  hso_price: z.coerce.number().min(0, "HSO price required"),
  purchase_date: z.string().min(1, "Purchase date required"),
});

type FormType = z.infer<typeof FormSchema>;

export const AddStockModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [productOpen, setProductOpen] = useState(false);

  const user = useAppSelector((state: RootState) => state.user.user);
  const dispatch = useAppDispatch();

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      product_id: 0,
      quantity: 1,
      cost: 0,
      selling_price: 0,
      hso_price: 0,
      purchase_date: new Date().toISOString().slice(0, 10),
    },
  });

  // Load products and suppliers
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select()
        .eq("company_id", user?.company_id)
        .order("name", { ascending: true });

      if (prodError) toast.error("Failed to load products.");
      else setProducts(prodData || []);
    };

    fetchData();
    form.reset({
      product_id: 0,
      quantity: 1,
      cost: 0,
      selling_price: 0,
      hso_price: 0,
      purchase_date: new Date().toISOString().slice(0, 10),
    });
  }, [form, isOpen, user?.company_id]);

  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const newStock = {
        ...data,
        remaining_quantity: data.quantity,
        company_id: user?.company_id,
      };

      const { data: inserted, error } = await supabase
        .from(table)
        .insert([newStock])
        .select();

      if (error) throw new Error(error.message);

      const product = products.find((p) => p.id === newStock.product_id);

      dispatch(
        addItem({
          ...inserted[0],
          product,
        })
      );

      toast.success("Stock added successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quantity = form.watch("quantity");
  const cost = form.watch("cost");
  const sellingPrice = form.watch("selling_price");
  const hsoPrice = form.watch("hso_price");

  const priceInsights = useMemo(() => {
    const totalCost = Number(quantity || 0) * Number(cost || 0);
    const grossPerUnit = Number(sellingPrice || 0) - Number(cost || 0);
    const grossPercent =
      Number(cost || 0) > 0
        ? Math.round((grossPerUnit / Number(cost)) * 100)
        : 0;

    return {
      totalCost,
      grossPerUnit,
      grossPercent,
      hsoDiff: Number(sellingPrice || 0) - Number(hsoPrice || 0),
    };
  }, [cost, hsoPrice, quantity, sellingPrice]);

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="app__modal_dialog_panel_sm">
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              Add Stock
            </DialogTitle>
          </div>

          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="mb-3 flex flex-col gap-1.5 rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Quick guidance
                  </span>
                  <span>
                    Fill in pricing to instantly see margins and totals. Product
                    search is keyboard-friendly; type to filter.
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* PRODUCT */}
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product / Item</FormLabel>
                        <Popover
                          open={productOpen}
                          onOpenChange={setProductOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              onClick={() => setProductOpen(true)}
                            >
                              {field.value
                                ? products.find((p) => p.id === field.value)
                                    ?.name
                                : "Select product/item"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search product..." />
                              <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map((p) => (
                                    <CommandItem
                                      key={p.id}
                                      value={p.name}
                                      onSelect={() => {
                                        form.setValue("product_id", p.id);
                                        setProductOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          p.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-foreground">
                                          {p.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          Unit: {p.unit}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* QUANTITY */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            min={1}
                            inputMode="numeric"
                            placeholder="e.g. 50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PURCHASE PRICE */}
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            step="any"
                            min={0}
                            inputMode="decimal"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormDescription>
                          Cost per unit. Impacts margin summary.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SELLING PRICE */}
                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price /cu.m.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            step="any"
                            min={0}
                            inputMode="decimal"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormDescription>
                          Desired per-unit selling price.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* HSO PRICE */}
                  <FormField
                    control={form.control}
                    name="hso_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HSO Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            step="any"
                            min={0}
                            inputMode="decimal"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormDescription>
                          Reference price used in HSO.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PURCHASE DATE */}
                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min="2000-01-01"
                            max={new Date().toISOString().slice(0, 10)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr]">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Total Cost
                      </span>
                      <span className="font-semibold text-foreground">
                        {priceInsights.totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Gross / Unit
                      </span>
                      <span className="font-semibold text-foreground">
                        {priceInsights.grossPerUnit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {priceInsights.grossPercent ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({priceInsights.grossPercent}%)
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        vs HSO
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          priceInsights.hsoDiff >= 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        )}
                      >
                        {priceInsights.hsoDiff.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="app__modal_dialog_footer flex justify-end gap-2">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
