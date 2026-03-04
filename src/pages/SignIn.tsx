import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { signInSchema, type SignInValues } from "@/lib/validation";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const SignIn = () => {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: SignInValues) => {
    toast.success("Sign in validated successfully");
    console.log("Sign in data:", data);
  };

  return (
    <AuthLayout title={t("signin.title")} subtitle={t("signin.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{t("signin.email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="bg-muted border-border input-glow"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("signin.password")}</Label>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className="bg-muted border-border input-glow"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full btn-royal text-primary-foreground border-0" size="lg" disabled={isSubmitting}>
          {t("signin.button")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("signin.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            {t("signin.signupLink")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
