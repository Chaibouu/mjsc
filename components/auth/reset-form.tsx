"use client";

import * as z from "zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";

import { PasswordResetSchema } from "@/schemas";
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
import { AuthBrandPanel, AuthMobileBrand } from "@/components/auth/auth-brand-panel";
import { forgotPassword } from "@/actions/forgotPassword";

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof PasswordResetSchema>>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof PasswordResetSchema>) => {
    setError("");

    startTransition(() => {
      forgotPassword(values)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            return;
          }
          setSentTo(values.email);
        })
        .catch(() => setError("Une erreur est survenue, veuillez réessayer."));
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Carte rectangulaire avec 2 côtés */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Côté gauche - Couleur MJSC avec logo */}
          <AuthBrandPanel message="Vous avez oublié votre mot de passe ? Recevez par email un lien sécurisé pour en choisir un nouveau." />

          {/* Côté droit - Formulaire ou confirmation d'envoi */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <AuthMobileBrand />
            {sentTo ? (
              <div className="text-center space-y-5">
                <div className="mx-auto w-14 h-14 rounded-full bg-primaryColor/10 flex items-center justify-center">
                  <MailCheck className="w-7 h-7 text-primaryColor" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Vérifiez votre boîte de réception
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Si un compte existe pour{" "}
                    <span className="font-medium text-gray-900 break-all">{sentTo}</span>,
                    un lien de réinitialisation vient d&apos;être envoyé.
                  </p>
                </div>
                <ul className="text-left text-sm text-gray-600 bg-gray-50 rounded-lg p-4 space-y-1.5">
                  <li>Le lien est valable 1 heure.</li>
                  <li>Pensez à vérifier vos courriers indésirables.</li>
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSentTo(null);
                    setError("");
                  }}
                >
                  Utiliser une autre adresse
                </Button>
              </div>
            ) : (
              <>
                {/* Titre du formulaire */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primaryColor/10 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-primaryColor" aria-hidden />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Mot de passe oublié ?
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Saisissez l&apos;adresse email de votre compte.
                  </p>
                </div>

                {/* Formulaire */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <Mail
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                              aria-hidden
                            />
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="john.doe@example.com"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                className="pl-9"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormError message={error} />
                    <Button
                      loading={isPending}
                      type="submit"
                      className="w-full bg-primaryColor text-white hover:bg-primaryColor/90"
                    >
                      {isPending ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {/* Retour à la connexion */}
            <div className="text-center mt-6">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-primaryColor hover:text-primaryDarkColor font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
