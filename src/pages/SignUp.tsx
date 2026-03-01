import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { signUpSchema, type SignUpValues, CANADIAN_PROVINCES } from "@/lib/validation";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

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

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { country: "Canada" },
  });

  const onSubmit = (data: SignUpValues) => {
    toast.success("Sign up validated successfully");
    console.log("Sign up data:", data);
  };

  return (
    <AuthLayout title={t("signup.title")} subtitle={t("signup.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label={t("signup.fullName")} id="fullName" error={errors.fullName?.message}>
          <Input id="fullName" placeholder="Jean-François O'Brien" autoComplete="name" {...register("fullName")} />
        </FormField>

        <fieldset className="space-y-4 rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium text-muted-foreground">{t("signup.address")}</legend>

          <FormField label={t("signup.street")} id="street" error={errors.street?.message}>
            <Input id="street" placeholder="123 Maple St" autoComplete="street-address" {...register("street")} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("signup.city")} id="city" error={errors.city?.message}>
              <Input id="city" placeholder="Toronto" autoComplete="address-level2" {...register("city")} />
            </FormField>

            <FormField label={t("signup.province")} id="province" error={errors.province?.message}>
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="province">
                      <SelectValue placeholder={t("signup.select")} />
                    </SelectTrigger>
                    <SelectContent>
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
              <Input id="postalCode" placeholder="A1A 1A1" autoComplete="postal-code" {...register("postalCode")} />
            </FormField>

            <FormField label={t("signup.country")} id="country" error={errors.country?.message}>
              <Input id="country" autoComplete="country-name" {...register("country")} />
            </FormField>
          </div>
        </fieldset>

        <FormField label={t("signup.email")} id="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label={t("signup.password")} id="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            placeholder={t("signup.passwordPlaceholder")}
            autoComplete="new-password"
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((p) => !p)}
            {...register("password")}
          />
        </FormField>

        <FormField label={t("signup.passwordConfirm")} id="passwordConfirmation" error={errors.passwordConfirmation?.message}>
          <PasswordInput
            id="passwordConfirmation"
            placeholder={t("signup.passwordConfirmPlaceholder")}
            autoComplete="new-password"
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((p) => !p)}
            {...register("passwordConfirmation")}
          />
        </FormField>

        <FormField label={t("signup.nas")} id="nas" error={errors.nas?.message}>
          <Input id="nas" placeholder="123 456 789" autoComplete="off" {...register("nas")} />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {t("signup.button")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("signup.hasAccount")}{" "}
          <Link to="/signin" className="font-medium text-primary hover:underline">
            {t("signup.signinLink")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
