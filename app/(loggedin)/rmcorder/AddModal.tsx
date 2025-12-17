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
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { addItem } from "@/store/listSlice";
import { Customer, ProductStock, RootState } from "@/types";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const FormSchema = z.object({
  customer_id: z.coerce.number().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  po_number: z.string().optional(),
  so_number: z.string().min(1, "SO Number is required"),
  quantity_cu_m: z.coerce.number().min(10, "Minimum order is 10 cubic meters"),
  consumables: z.coerce.number().min(0, "Consumables must be 0 or greater"),
});

type FormType = z.infer<typeof FormSchema>;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModal = ({ isOpen, onClose }: ModalProps) => {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portlandCementStocks, setPortlandCementStocks] = useState<
    ProductStock[]
  >([]);
  const [crushedGravelStocks, setCrushedGravelStocks] = useState<
    ProductStock[]
  >([]);
  const [washedSandStocks, setWashedSandStocks] = useState<ProductStock[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [manualPortlandCement, setManualPortlandCement] = useState<
    number | null
  >(null);
  const [manualCrushedGravel, setManualCrushedGravel] = useState<number | null>(
    null
  );
  const [manualWashedSand, setManualWashedSand] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.user.user);

  const [open, setOpen] = useState(false);

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      po_number: "",
      so_number: "",
      customer_id: 0,
      quantity_cu_m: 1,
      consumables: 0,
    },
  });

  const quantityCuM = form.watch("quantity_cu_m");
  const consumables = form.watch("consumables");

  // Calculate quantities needed per 10 cu.m
  // Per 10 cu.m: 100 bags Portland Cement, 1.5 cu.m Crushed Gravel, 1 cu.m Washed Sand
  // Use manual values if provided, otherwise calculate from quantity
  const calculations = useMemo(() => {
    const batches = quantityCuM / 10; // Number of 10 cu.m batches
    return {
      batches,
      portlandCementBags:
        manualPortlandCement !== null ? manualPortlandCement : batches * 100,
      crushedGravelCuM:
        manualCrushedGravel !== null ? manualCrushedGravel : batches * 1.5,
      washedSandCuM: manualWashedSand !== null ? manualWashedSand : batches * 1,
    };
  }, [
    quantityCuM,
    manualPortlandCement,
    manualCrushedGravel,
    manualWashedSand,
  ]);

  // Fetch customers and product stocks
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoadingProducts(true);
      try {
        // Fetch customers
        const { data: customersData } = await supabase
          .from("customers")
          .select("*")
          .eq("company_id", user?.company_id)
          .order("name", { ascending: true });

        setCustomers(customersData);

        // First, fetch product IDs for Portland Cement
        const { data: portlandProducts } = await supabase
          .from("products")
          .select("id")
          .eq("company_id", user?.company_id)
          .ilike("name", "%portland cement%");

        const portlandProductIds = portlandProducts?.map((p) => p.id) || [];

        // Fetch Portland Cement stocks
        const { data: portlandData } = await supabase
          .from("product_stocks")
          .select(
            "*,product:product_id(*),purchase_order:purchase_order_id(po_number)"
          )
          .gt("remaining_quantity", 0)
          .eq("company_id", user?.company_id)
          .in("product_id", portlandProductIds)
          .order("purchase_date", { ascending: true });

        console.log("portlandData", portlandData);

        // First, fetch product IDs for Crushed Gravel
        const { data: gravelProducts } = await supabase
          .from("products")
          .select("id")
          .eq("company_id", user?.company_id)
          .ilike("name", "%crushed gravel%");

        const gravelProductIds = gravelProducts?.map((p) => p.id) || [];

        // Fetch Crushed Gravel stocks
        const { data: gravelData } = await supabase
          .from("product_stocks")
          .select(
            "*,product:product_id(*),purchase_order:purchase_order_id(po_number)"
          )
          .gt("remaining_quantity", 0)
          .eq("company_id", user?.company_id)
          .in("product_id", gravelProductIds)
          .order("purchase_date", { ascending: true });

        // First, fetch product IDs for Washed Sand
        const { data: sandProducts } = await supabase
          .from("products")
          .select("id")
          .eq("company_id", user?.company_id)
          .ilike("name", "%washed sand%");

        const sandProductIds = sandProducts?.map((p) => p.id) || [];

        // Fetch Washed Sand stocks
        const { data: sandData } = await supabase
          .from("product_stocks")
          .select(
            "*,product:product_id(*),purchase_order:purchase_order_id(po_number)"
          )
          .gt("remaining_quantity", 0)
          .eq("company_id", user?.company_id)
          .in("product_id", sandProductIds)
          .order("purchase_date", { ascending: true });

        setPortlandCementStocks(portlandData || []);
        setCrushedGravelStocks(gravelData || []);
        setWashedSandStocks(sandData || []);

        if (!portlandData || portlandData.length === 0) {
          toast.error(
            "No Portland Cement stock found. Please add stock first."
          );
        }
        if (!gravelData || gravelData.length === 0) {
          toast.error("No Crushed Gravel stock found. Please add stock first.");
        }
        if (!sandData || sandData.length === 0) {
          toast.error("No Washed Sand stock found. Please add stock first.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
    form.reset({
      date: new Date().toISOString().slice(0, 10),
      po_number: "",
      so_number: "",
      customer_id: 0,
      quantity_cu_m: 10,
      consumables: 0,
    });
    // Reset manual overrides when modal opens
    setManualPortlandCement(null);
    setManualCrushedGravel(null);
    setManualWashedSand(null);
  }, [isOpen, user?.company_id, form]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    let total = 0;

    // Portland Cement cost (using first available stock's selling_price)
    if (portlandCementStocks.length > 0) {
      const price = portlandCementStocks[0].selling_price;
      total += calculations.portlandCementBags * price;
    }

    // Crushed Gravel cost
    if (crushedGravelStocks.length > 0) {
      const price = crushedGravelStocks[0].selling_price;
      total += calculations.crushedGravelCuM * price;
    }

    // Washed Sand cost
    if (washedSandStocks.length > 0) {
      const price = washedSandStocks[0].selling_price;
      total += calculations.washedSandCuM * price;
    }

    // Add consumables
    total += Number(consumables) || 0;

    return total;
  }, [
    portlandCementStocks,
    crushedGravelStocks,
    washedSandStocks,
    consumables,
    calculations.portlandCementBags,
    calculations.crushedGravelCuM,
    calculations.washedSandCuM,
  ]);

  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate that we have required stocks
      if (portlandCementStocks.length === 0) {
        toast.error("Portland Cement stock is required");
        setIsSubmitting(false);
        return;
      }
      if (crushedGravelStocks.length === 0) {
        toast.error("Crushed Gravel stock is required");
        setIsSubmitting(false);
        return;
      }
      if (washedSandStocks.length === 0) {
        toast.error("Washed Sand stock is required");
        setIsSubmitting(false);
        return;
      }

      // Validate quantities don't exceed available stock
      const portlandStock = portlandCementStocks[0];
      const gravelStock = crushedGravelStocks[0];
      const sandStock = washedSandStocks[0];

      if (calculations.portlandCementBags > portlandStock.remaining_quantity) {
        toast.error(
          `Insufficient Portland Cement stock. Available: ${portlandStock.remaining_quantity} bags, Required: ${calculations.portlandCementBags} bags`
        );
        setIsSubmitting(false);
        return;
      }

      if (calculations.crushedGravelCuM > gravelStock.remaining_quantity) {
        toast.error(
          `Insufficient Crushed Gravel stock. Available: ${gravelStock.remaining_quantity} cu.m, Required: ${calculations.crushedGravelCuM} cu.m`
        );
        setIsSubmitting(false);
        return;
      }

      if (calculations.washedSandCuM > sandStock.remaining_quantity) {
        toast.error(
          `Insufficient Washed Sand stock. Available: ${sandStock.remaining_quantity} cu.m, Required: ${calculations.washedSandCuM} cu.m`
        );
        setIsSubmitting(false);
        return;
      }

      // Create sales order
      const newData = {
        date: formdata.date,
        customer_id: formdata.customer_id,
        so_number: formdata.so_number,
        po_number: formdata.po_number ?? "",
        total_amount: totalCost,
        delivery_fee: 0,
        status: "reserved",
        payment_status: "unpaid",
        company_id: user?.company_id,
      };

      const { data: insertedPO, error: insertPOError } = await supabase
        .from("sales_orders")
        .insert([newData])
        .select();

      if (insertPOError) {
        console.error("Error adding sales order:", insertPOError);
        toast.error("Failed to create order");
        setIsSubmitting(false);
        return;
      }

      const newPOId = insertedPO[0].id;

      // Create sales order items
      const salesOrderItems = [
        {
          sales_order_id: newPOId,
          product_stock_id: portlandStock.id,
          product_id: portlandStock.product_id,
          quantity: calculations.portlandCementBags,
          unit_price: portlandStock.selling_price,
          discount: 0,
          total: calculations.portlandCementBags * portlandStock.selling_price,
          company_id: user?.company_id,
        },
        {
          sales_order_id: newPOId,
          product_stock_id: gravelStock.id,
          product_id: gravelStock.product_id,
          quantity: calculations.crushedGravelCuM,
          unit_price: gravelStock.selling_price,
          discount: 0,
          total: calculations.crushedGravelCuM * gravelStock.selling_price,
          company_id: user?.company_id,
        },
        {
          sales_order_id: newPOId,
          product_stock_id: sandStock.id,
          product_id: sandStock.product_id,
          quantity: calculations.washedSandCuM,
          unit_price: sandStock.selling_price,
          discount: 0,
          total: calculations.washedSandCuM * sandStock.selling_price,
          company_id: user?.company_id,
        },
      ];

      // Prepare Redux items with proper product_stock references
      const salesOrderItemsRedux = [
        {
          sales_order_id: newPOId,
          product_stock_id: portlandStock.id,
          product_stock: portlandStock,
          product_id: portlandStock.product_id,
          quantity: calculations.portlandCementBags,
          unit_price: portlandStock.selling_price,
          discount: 0,
          total: calculations.portlandCementBags * portlandStock.selling_price,
        },
        {
          sales_order_id: newPOId,
          product_stock_id: gravelStock.id,
          product_stock: gravelStock,
          product_id: gravelStock.product_id,
          quantity: calculations.crushedGravelCuM,
          unit_price: gravelStock.selling_price,
          discount: 0,
          total: calculations.crushedGravelCuM * gravelStock.selling_price,
        },
        {
          sales_order_id: newPOId,
          product_stock_id: sandStock.id,
          product_stock: sandStock,
          product_id: sandStock.product_id,
          quantity: calculations.washedSandCuM,
          unit_price: sandStock.selling_price,
          discount: 0,
          total: calculations.washedSandCuM * sandStock.selling_price,
        },
      ];

      // Add consumables as other_charges if > 0
      if (formdata.consumables > 0) {
        await supabase
          .from("sales_orders")
          .update({
            other_charges: "Consumables",
            other_charges_amount: formdata.consumables,
          })
          .eq("id", newPOId);
      }

      const { error: insertItemsError } = await supabase
        .from("sales_order_items")
        .insert(salesOrderItems)
        .select();

      if (insertItemsError) {
        console.error("Error adding sales order items:", insertItemsError);
        toast.error("Failed to create order items");
        setIsSubmitting(false);
        return;
      }

      // Update logs
      await supabase.from("product_change_logs").insert({
        sales_order_id: newPOId,
        user_id: user?.system_user_id,
        user_name: user?.name,
        message: `created RMC order for ${formdata.quantity_cu_m} cu.m`,
      });

      // Update Redux
      dispatch(
        addItem({
          ...newData,
          customer: customers?.find(
            (c) => c.id.toString() === formdata.customer_id.toString()
          ),
          order_items: salesOrderItemsRedux,
          id: newPOId,
        })
      );

      toast.success("RMC Order created successfully!");
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel transition className="app__modal_dialog_panel_lg">
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              Create RMC Order
            </DialogTitle>
          </div>
          <div className="hidden lg:block app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="max-w-40">
                        <FormLabel className="app__formlabel_standard">
                          Order Date
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

                  <FormField
                    control={form.control}
                    name="so_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          SO Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="app__input_standard"
                            placeholder="RMC-001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Customer
                        </FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between hover:bg-white",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? customers?.find(
                                      (s) =>
                                        s.id.toString() ===
                                        field.value.toString()
                                    )?.name
                                  : "Select customer"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search customer..." />
                              <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                  {customers?.map((s) => (
                                    <CommandItem
                                      value={s.name}
                                      key={s.id}
                                      onSelect={(selectedName) => {
                                        const selectedCustomer = customers.find(
                                          (sup) =>
                                            sup.name.toLowerCase() ===
                                            selectedName.toLowerCase()
                                        );
                                        if (selectedCustomer) {
                                          field.onChange(selectedCustomer.id);
                                        }
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          s.id.toString() ===
                                            field.value?.toString()
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {s.name}
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

                  <FormField
                    control={form.control}
                    name="po_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Customer P.O. Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="P.O. number"
                            className="app__input_standard"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity_cu_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Quantity (Cubic Meters)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            min="10"
                            className="app__input_standard"
                            placeholder="10"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(Math.max(10, value));
                              // Reset manual overrides when main quantity changes
                              setManualPortlandCement(null);
                              setManualCrushedGravel(null);
                              setManualWashedSand(null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Minimum: 10 cu.m
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consumables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Consumables Cost
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            className="app__input_standard"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Material Calculations Display */}
                <div className="mt-6 p-4 bg-muted/40 rounded-md border border-border/60">
                  <h4 className="font-medium mb-3">Material Requirements</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Portland Cement:
                        </span>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="h-7 w-24 text-sm"
                          value={calculations.portlandCementBags}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setManualPortlandCement(value >= 0 ? value : null);
                          }}
                        />
                        <span className="text-muted-foreground text-xs">
                          bags
                        </span>
                      </div>
                      {portlandCementStocks.length > 0 && (
                        <span className="text-muted-foreground text-xs">
                          @ ₱{portlandCementStocks[0].selling_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Crushed Gravel:
                        </span>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="h-7 w-24 text-sm"
                          value={calculations.crushedGravelCuM}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setManualCrushedGravel(value >= 0 ? value : null);
                          }}
                        />
                        <span className="text-muted-foreground text-xs">
                          cu.m
                        </span>
                      </div>
                      {crushedGravelStocks.length > 0 && (
                        <span className="text-muted-foreground text-xs">
                          @ ₱{crushedGravelStocks[0].selling_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Washed Sand:
                        </span>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="h-7 w-24 text-sm"
                          value={calculations.washedSandCuM}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setManualWashedSand(value >= 0 ? value : null);
                          }}
                        />
                        <span className="text-muted-foreground text-xs">
                          cu.m
                        </span>
                      </div>
                      {washedSandStocks.length > 0 && (
                        <span className="text-muted-foreground text-xs">
                          @ ₱{washedSandStocks[0].selling_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Consumables:
                      </span>{" "}
                      <span className="font-semibold">
                        ₱{(Number(consumables) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold">
                        ₱{totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {loadingProducts && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Loading product stocks...
                  </div>
                )}

                <div className="app__modal_dialog_footer">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || loadingProducts}
                  >
                    {isSubmitting ? "Creating..." : "Create Order"}
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
