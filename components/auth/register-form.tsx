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
import appConfig from "@/settings";
import Image from "next/image";

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
          {/* Côté gauche - Couleur MJSC avec logo */}
          <div 
            className="p-8 flex flex-col justify-center items-center text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${appConfig.primaryColor} 0%, ${appConfig.primaryDarkColor} 100%)`
            }}
          >
            {/* Formes décoratives */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            
            {/* Contenu */}
            <div className="relative z-10 text-center px-6">
              {/* Logo MJSC */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                  <Image
                    src="/armoirie.png"
                    alt="Logo MJSC"
                    width={96}
                    height={96}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              
              {/* Titre principal */}
              <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                République du Niger
              </h1>
              
              {/* Devise */}
              <p className="text-sm mb-4 text-white/95">
                Fraternité – Travail – Progrès
              </p>
              
              {/* Nom du ministère */}
              <h2 className="text-lg md:text-xl font-semibold mb-8 text-white/90">
                Ministère de la Jeunesse, des Sports et de la Culture
              </h2>
              
              {/* Message de bienvenue */}
              <div className="mt-8 space-y-4 text-left">
                <p className="text-white/95 text-center text-sm md:text-base leading-relaxed">
                  Bienvenue sur la plateforme numérique du Ministère. Créez votre compte pour accéder à votre espace personnel.
                </p>
              </div>
              
              {/* Informations système */}
              <div className="mt-10 space-y-3">
                {/* Badge sécurisé */}
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/95 font-medium text-[9px] md:text-base">Système sécurisé</span>
                </div>
              </div>
            </div>
          </div>

          {/* Côté droit - Formulaire */}
          <div className="p-8 flex flex-col justify-center">
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
            disabled={isPending}
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