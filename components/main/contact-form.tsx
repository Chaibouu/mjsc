"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ContactSchema, type ContactValues } from "@/schemas/contact";
import { sendContactMessage } from "@/actions/contact";
import appConfig from "@/settings";

const fieldClass =
  "w-full border-2 border-gray-200 focus:border-primaryColor focus:ring-2 focus:ring-primaryLightTransparentColor transition-colors";

const emptyValues: ContactValues = { name: "", email: "", subject: "", message: "", website: "" };

/** Formulaire de contact du site : envoi sans rechargement, loader sur le bouton, confirmation sur place. */
export default function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: emptyValues,
  });

  const onSubmit = (values: ContactValues) => {
    setError(undefined);
    startTransition(async () => {
      const result = await sendContactMessage(values);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      form.reset(emptyValues);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primaryColor/10">
          <CircleCheck className="h-9 w-9 text-primaryColor" aria-hidden />
        </div>
        <h4 className="mb-2 text-lg font-semibold text-gray-900">Message envoyé</h4>
        <p className="mb-8 max-w-sm text-sm text-gray-600">
          Merci de nous avoir écrit. Votre message a bien été transmis à nos services, nous vous
          répondrons par email dans les plus brefs délais.
        </p>
        <Button type="button" variant="outline" onClick={() => setSent(false)}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Nom</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Votre nom" autoComplete="name" disabled={isPending} className={fieldClass} />
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
                <FormLabel className="text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="votre@email.com" autoComplete="email" disabled={isPending} className={fieldClass} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Sujet</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Objet de votre message" disabled={isPending} className={fieldClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Message</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Votre message..." rows={5} disabled={isPending} className={`${fieldClass} resize-none`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ piège pour les robots, invisible pour les visiteurs */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-px w-px opacity-0"
          {...form.register("website")}
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={isPending}
          className="mt-6 w-full text-white shadow-md transition-all duration-200 hover:shadow-lg"
          style={{ backgroundColor: appConfig.pprimaryColor }}
        >
          {isPending ? "Envoi en cours…" : "Envoyer le message"}
          {!isPending && <ArrowRight className="ml-2 h-4 w-4" aria-hidden />}
        </Button>
      </form>
    </Form>
  );
}
