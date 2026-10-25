"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Icon } from "@iconify/react";

import { SignupSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,  
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { signup } from "@/actions/signup";
import { AuthBrandPanel, AuthMobileBrand } from "@/components/auth/auth-brand-panel";

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SignupSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      signup(values)
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Carte rectangulaire avec 2 côtés */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Côté gauche - Couleur MJSC avec logo (à partir de la tablette) */}
          <AuthBrandPanel message="Bienvenue sur la plateforme numérique du Ministère. Créez votre compte pour accéder à votre espace personnel." />

          {/* Côté droit - Formulaire */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <AuthMobileBrand />
            {/* Titre du formulaire */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Créer un compte
              </h2>
              <p className="text-gray-600 text-sm">
                Rejoignez notre plateforme
              </p>
            </div>

            {/* Formulaire */}
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                        <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="john.doe@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="******"
                              type={showPassword ? "text" : "password"}
                    />
                  </FormControl>
                          <div
                            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? (
                              <Icon icon="mdi:eye-off" width={24} height={24} />
                            ) : (
                              <Icon icon="mdi:eye" width={24} height={24} />
                            )}
                          </div>
                        </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button
            loading={isPending}
            type="submit"
                  className="w-full bg-primaryColor text-white hover:bg-primaryColor/90"
          >
                  Créer un compte
          </Button>
                
                {/* Message pour se connecter */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Vous avez déjà un compte ?{" "}
                    <Link 
                      href="/auth/login" 
                      className="text-primaryColor hover:text-primaryDarkColor font-medium transition-colors underline"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
        </form>
      </Form>
          </div>
        </div>
      </div>
    </div>
  );
};