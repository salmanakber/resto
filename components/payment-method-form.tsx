"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  useStripe,
  useElements,
  Elements,
  CardElement,
} from "@stripe/react-stripe-js";

// Schema
const paymentMethodSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  isDefault: z.boolean().default(false),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Wrapper component to fetch settings before rendering actual form
export function PaymentMethodForm(props: PaymentMethodFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
    const load = async () => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "paymentGateway", isPublic: true }),
      });
      if (!res.ok) return toast.error("Failed to load Stripe settings");

      const { value } = await res.json();
      const settings = JSON.parse(value);
      const apiKey = settings?.credential?.stripe?.apiKey;

      if (!apiKey) return toast.error("Stripe API key not found");

      const stripe = loadStripe(apiKey);
      setStripePromise(stripe);
    };
    load();
  } catch (error) {
    console.error("Error loading Stripe settings:", error);
    toast.error("Failed to load Stripe settings");
  } finally {
    setLoading(false);
  } 
  
  }, []);

  if (loading || !stripePromise) return <div>Loading payment form…</div>;

  return (
    <Elements stripe={stripePromise}>
      <StripeForm {...props} />
    </Elements>
  );
}

// The actual form using Stripe Elements
function StripeForm({ onSuccess, onCancel }: PaymentMethodFormProps) {
  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardholderName: "",
      isDefault: false,
    },
  });

  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      if (!stripe || !elements) {
        toast.error("Stripe is not ready");
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast.error("Card input not available");
        return;
      }

      setIsLoading(true);

      const result = await stripe.createToken(cardElement, {
        name: data.cardholderName,
      });

      if (result.error || !result.token) {
        toast.error(result.error?.message || "Token creation failed");
        return;
      }

      // Send token to your backend
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: result.token.id,
          cardHolderName: data.cardholderName,
          isDefault: data.isDefault,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error);

      toast.success("Card saved successfully");
      onSuccess?.();
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Cardholder name */}
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cardholder Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stripe Card Input */}
        <div className="p-4 border rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1a202c",
                  "::placeholder": { color: "#a0aec0" },
                },
                invalid: {
                  color: "#e53e3e",
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>

        {/* Default toggle */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
              <FormLabel>Use as default</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !stripe}>
            {isLoading ? "Saving..." : "Save Card"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
