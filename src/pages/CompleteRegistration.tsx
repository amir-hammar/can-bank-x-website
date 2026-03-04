import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CANADIAN_PROVINCES } from "@/lib/validation";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { registerCustomer, type CustomerRegistrationData } from "@/lib/api";
import { getUserInfo } from "@/lib/keycloak";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  province: z.enum(CANADIAN_PROVINCES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a province" }),
  }),
  postalCode: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Invalid postal code format (e.g., A1A 1A1)"),
  country: z.string().default("Canada"),
  nas: z
    .string()
    .regex(/^\d{3}[\s-]?\d{3}[\s-]?\d{3}$/, "Invalid NAS format (e.g., 123 456 789)"),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

const FormField = ({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);

const inputClasses = "bg-muted border-border input-glow";

const CompleteRegistration = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const userInfo = getUserInfo();
  const email = userInfo?.email || "";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { country: "Canada" },
  });

  const onSubmit = async (data: RegistrationValues) => {
    try {
      const registrationData: CustomerRegistrationData = {
        fullName: data.fullName,
        email,
        address: {
          street: data.street,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode.replace(/\s/g, "").toUpperCase(),
          country: data.country,
        },
        nas: data.nas.replace(/[\s-]/g, ""),
      };

      const response = await registerCustomer(registrationData);
      setCustomerId(response.customer_id);
      
      toast.success("Customer registration successful!");
      
      // Redirect to KYC submission or dashboard
      setTimeout(() => {
        navigate("/kyc/submit");
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    }
  };

  if (customerId) {
    return (
      <AuthLayout 
        title="Registration Complete" 
        subtitle="Your customer account has been created"
      >
        <div className="space-y-6 text-center">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Customer ID</p>
            <p className="font-mono text-lg text-foreground">{customerId}</p>
          </div>
          <p className="text-muted-foreground">
            Redirecting to KYC verification...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Complete Your Registration" 
      subtitle="Provide your details to complete your customer profile"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label={t("signup.fullName")} id="fullName" error={errors.fullName?.message}>
          <Input 
            id="fullName" 
            placeholder="Jean-François O'Brien" 
            autoComplete="name" 
            className={inputClasses} 
            {...register("fullName")} 
          />
        </FormField>

        <fieldset className="space-y-4 rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium text-muted-foreground">
            {t("signup.address")}
          </legend>

          <FormField label={t("signup.street")} id="street" error={errors.street?.message}>
            <Input 
              id="street" 
              placeholder="123 Maple St" 
              autoComplete="street-address" 
              className={inputClasses} 
              {...register("street")} 
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("signup.city")} id="city" error={errors.city?.message}>
              <Input 
                id="city" 
                placeholder="Toronto" 
                autoComplete="address-level2" 
                className={inputClasses} 
                {...register("city")} 
              />
            </FormField>

            <FormField label={t("signup.province")} id="province" error={errors.province?.message}>
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="province" className={inputClasses}>
                      <SelectValue placeholder={t("signup.select")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CANADIAN_PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("signup.postalCode")} id="postalCode" error={errors.postalCode?.message}>
              <Input 
                id="postalCode" 
                placeholder="A1A 1A1" 
                autoComplete="postal-code" 
                className={inputClasses} 
                {...register("postalCode")} 
              />
            </FormField>

            <FormField label={t("signup.country")} id="country" error={errors.country?.message}>
              <Input 
                id="country" 
                autoComplete="country-name" 
                className={inputClasses} 
                {...register("country")} 
              />
            </FormField>
          </div>
        </fieldset>

        <FormField label={t("signup.nas")} id="nas" error={errors.nas?.message}>
          <Input 
            id="nas" 
            placeholder="123 456 789" 
            autoComplete="off" 
            className={inputClasses} 
            {...register("nas")} 
          />
        </FormField>

        <Button 
          type="submit" 
          className="w-full btn-royal text-primary-foreground border-0" 
          size="lg" 
          disabled={isSubmitting}
        >
          Complete Registration
        </Button>
      </form>
    </AuthLayout>
  );
};

export default CompleteRegistration;
