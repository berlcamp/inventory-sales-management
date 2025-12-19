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
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const FormSchema = z.object({
  customer_id: z.coerce.number().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  po_number: z.string().optional(),
  so_number: z.string().min(1, "SO Number is required"),
  quantity_cu_m: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  price_per_cu_m: z.coerce
    .number()
    .min(0, "Price per cu.m. must be 0 or greater"),
  products: z
    .array(
      z.object({
        product_stock_id: z.coerce.number().min(1, "Product stock is required"),
        quantity: z.coerce
          .number()
          .min(0.01, "Quantity must be greater than 0"),
      })
    )
    .min(1, "At least one product is required"),
});

type FormType = z.infer<typeof FormSchema>;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModal = ({ isOpen, onClose }: ModalProps) => {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productsList, setProductsList] = useState<ProductStock[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.user.user);

  const [open, setOpen] = useState(false);
  const [openProductDropdowns, setOpenProductDropdowns] = useState<{
    [key: number]: boolean;
  }>({});

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      po_number: "",
      so_number: "",
      customer_id: 0,
      quantity_cu_m: 0,
      price_per_cu_m: 0,
      products: [
        {
          product_stock_id: 0,
          quantity: 0,
        },
      ],
    },
  });

  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "products",
  });

  const pricePerCuM = useWatch({ control, name: "price_per_cu_m" });
  const quantityCuM = useWatch({ control, name: "quantity_cu_m" });

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

        // Fetch all product stocks with remaining quantity > 0
        const { data: productsData } = await supabase
          .from("product_stocks")
          .select(
            "*,product:product_id(*),purchase_order:purchase_order_id(po_number)"
          )
          .gt("remaining_quantity", 0)
          .eq("company_id", user?.company_id)
          .order("purchase_date", { ascending: true });

        setProductsList(productsData || []);

        if (!productsData || productsData.length === 0) {
          toast.error("No product stocks found. Please add stock first.");
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
      quantity_cu_m: 0,
      price_per_cu_m: 0,
      products: [
        {
          product_stock_id: 0,
          quantity: 0,
        },
      ],
    });
  }, [isOpen, user?.company_id, form]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    // Calculate cost based on price per cu.m. multiplied by quantity only
    return (Number(pricePerCuM) || 0) * (Number(quantityCuM) || 0);
  }, [pricePerCuM, quantityCuM]);

  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate that we have products
      if (!formdata.products || formdata.products.length === 0) {
        toast.error("At least one product is required");
        setIsSubmitting(false);
        return;
      }

      // Validate quantities don't exceed available stock
      for (const product of formdata.products) {
        const productStock = productsList?.find(
          (p) => p.id === product.product_stock_id
        );

        if (!productStock) {
          toast.error("Selected product stock not found");
          setIsSubmitting(false);
          return;
        }

        if (product.quantity > productStock.remaining_quantity) {
          toast.error(
            `Insufficient stock for ${
              productStock.product?.name || "product"
            }. Available: ${productStock.remaining_quantity} ${
              productStock.product?.unit || ""
            }, Required: ${product.quantity}`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Create sales order
      const newData = {
        date: formdata.date,
        customer_id: formdata.customer_id,
        so_number: formdata.so_number,
        po_number: formdata.po_number ?? "",
        total_amount: totalCost,
        quantity_cu_m: formdata.quantity_cu_m,
        price_per_cu_m: formdata.price_per_cu_m,
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

      // Create sales order items from selected products
      const salesOrderItems = formdata.products.map((product) => {
        const productStock = productsList?.find(
          (p) => p.id === product.product_stock_id
        );
        if (!productStock) {
          throw new Error(
            `Product stock ${product.product_stock_id} not found`
          );
        }
        return {
          sales_order_id: newPOId,
          product_stock_id: product.product_stock_id,
          product_id: productStock.product_id,
          quantity: product.quantity,
          discount: 0,
          unit_price: 0,
          total: 0,
          company_id: user?.company_id,
        };
      });

      // Prepare Redux items with proper product_stock references
      const salesOrderItemsRedux = formdata.products.map((product) => {
        const productStock = productsList?.find(
          (p) => p.id === product.product_stock_id
        );
        if (!productStock) {
          throw new Error(
            `Product stock ${product.product_stock_id} not found`
          );
        }
        return {
          sales_order_id: newPOId,
          product_stock_id: product.product_stock_id,
          product_stock: productStock,
          product_id: productStock.product_id,
          quantity: product.quantity,
          unit_price: 0,
          discount: 0,
          total: 0,
        };
      });

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

                  <FormField
                    control={form.control}
                    name="price_per_cu_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__formlabel_standard">
                          Price with cu.m.
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

                {/* Material Requirements */}
                <div className="mt-6 p-4 bg-muted/40 rounded-md border border-border/60">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Material Requirements</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          product_stock_id: 0,
                          quantity: 0,
                        })
                      }
                    >
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const selectedProductStock = productsList?.find(
                        (p) =>
                          p.id.toString() ===
                          form
                            .watch(`products.${index}.product_stock_id`)
                            ?.toString()
                      );
                      return (
                        <div
                          key={field.id}
                          className="flex items-start gap-4 p-3 bg-background rounded-md border"
                        >
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name={`products.${index}.product_stock_id`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Product Stock
                                  </FormLabel>
                                  <Popover
                                    open={openProductDropdowns[index] || false}
                                    onOpenChange={(open) =>
                                      setOpenProductDropdowns({
                                        ...openProductDropdowns,
                                        [index]: open,
                                      })
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between hover:bg-white",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          <span className="truncate">
                                            {selectedProductStock
                                              ? `${
                                                  selectedProductStock.product
                                                    ?.name || ""
                                                }${
                                                  selectedProductStock.product
                                                    ?.sku
                                                    ? ` - ${selectedProductStock.product.sku}`
                                                    : ""
                                                } (Available: ${
                                                  selectedProductStock.remaining_quantity
                                                } ${
                                                  selectedProductStock.product
                                                    ?.unit || ""
                                                })`
                                              : "Select product stock"}
                                          </span>
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        <CommandInput placeholder="Search product..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            No product found.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {productsList?.map((s) => {
                                              const nameSku = s.product?.name
                                                ? `${s.product.name}${
                                                    s.product.sku
                                                      ? ` - ${s.product.sku}`
                                                      : ""
                                                  }-${s.id}`
                                                : "";

                                              // Prevent selecting same product_stock_id twice
                                              const isAlreadySelected = form
                                                .watch("products")
                                                .some(
                                                  (p, i) =>
                                                    p?.product_stock_id ===
                                                      s.id && i !== index
                                                );

                                              return (
                                                <CommandItem
                                                  key={s.id}
                                                  value={nameSku}
                                                  disabled={isAlreadySelected}
                                                  onSelect={(selectedName) => {
                                                    if (isAlreadySelected)
                                                      return;

                                                    const selectedProduct =
                                                      productsList.find(
                                                        (sup) => {
                                                          const fullName = sup
                                                            .product?.name
                                                            ? `${
                                                                sup.product.name
                                                              }${
                                                                sup.product.sku
                                                                  ? ` - ${sup.product.sku}`
                                                                  : ""
                                                              }-${sup.id}`
                                                            : "";
                                                          return (
                                                            fullName.toLowerCase() ===
                                                            selectedName.toLowerCase()
                                                          );
                                                        }
                                                      );
                                                    if (selectedProduct) {
                                                      field.onChange(
                                                        selectedProduct.id
                                                      );
                                                      setOpenProductDropdowns({
                                                        ...openProductDropdowns,
                                                        [index]: false,
                                                      });
                                                    }
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
                                                  {s.product?.name || ""}
                                                  {s.product?.sku
                                                    ? ` - ${s.product.sku}`
                                                    : ""}{" "}
                                                  (Available:{" "}
                                                  {s.remaining_quantity}{" "}
                                                  {s.product?.unit || ""})
                                                </CommandItem>
                                              );
                                            })}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="w-32">
                            <FormField
                              control={form.control}
                              name={`products.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Quantity
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="any"
                                      min="0.01"
                                      className="app__input_standard"
                                      placeholder="0"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {selectedProductStock && (
                                    <p className="text-xs text-muted-foreground">
                                      @ ₱
                                      {selectedProductStock.selling_price.toFixed(
                                        2
                                      )}
                                      /
                                      {selectedProductStock.product?.unit || ""}
                                    </p>
                                  )}
                                </FormItem>
                              )}
                            />
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-8"
                              onClick={() => remove(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Price per cu.m. × Quantity:
                      </span>
                      <span className="font-semibold">
                        ₱
                        {(
                          (Number(pricePerCuM) || 0) *
                          (Number(quantityCuM) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
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
