"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Eye, EyeOff, KeyRound, Mail, Pencil, Power, Trash2 } from "lucide-react";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/Forms/FormDialogContent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/notify";
import { showSuccess } from "@/components/success-overlay";
import { cn } from "@/lib/utils";
import { roleLabels, sexeLabels } from "@/settings/labels";
import { type Role } from "@/lib/roles";
import { CreateUserSchema } from "@/schemas/user";
import {
  createUser,
  deleteUser,
  getUserById,
  sendUserPasswordReset,
  updateUser,
  updateUserPassword,
  type UserListItem,
} from "@/actions/users";
import { UserAvatarImage, StatusBadge, fullName, formatDate } from "./utilisateurs-ui";

/* -------------------------------------------------------------------------- */
/*  Fenêtre commune : coins droits, fermeture uniquement par la croix ou « Fermer »  */
/* -------------------------------------------------------------------------- */

function UserDialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  size?: "md" | "lg";
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <FormDialogContent
        className={cn(
          "flex max-h-[92dvh] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-5 py-4 pr-14 sm:px-6">
          <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm text-gray-600">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      </FormDialogContent>
    </Dialog>
  );
}

function CloseButton({ onClose, disabled }: { onClose: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" className="rounded-none" onClick={onClose} disabled={disabled}>
      Fermer
    </Button>
  );
}

function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/**
 * Lance l'action, lève son message d'erreur, puis rafraîchit la liste. Le succès s'affiche en
 * toast, ou en confirmation plein écran (coche animée) quand `celebrate` est fourni.
 */
function useUserAction<TVars>(
  action: (vars: TVars) => Promise<{ error?: string; message?: string }>,
  {
    success,
    celebrate,
    onDone,
  }: { success: string; celebrate?: (vars: TVars) => string; onDone: () => void }
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: TVars) => {
      const result = await action(vars);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_result, vars) => {
      if (celebrate) showSuccess({ title: success, message: celebrate(vars) });
      else notify.success(success);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Voir                                                                       */
/* -------------------------------------------------------------------------- */

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-gray-900">
        {value || <span className="font-normal italic text-gray-400">Non renseigné</span>}
      </dd>
    </div>
  );
}

export function ViewUserDialog({
  open,
  user,
  canManage,
  onClose,
  onEdit,
}: {
  open: boolean;
  user: UserListItem | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (u: UserListItem) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", user?.id],
    enabled: open && !!user,
    queryFn: async () => {
      const result = await getUserById(user!.id);
      if (result.error || !result.user) throw new Error(result.error ?? "Utilisateur introuvable");
      return result.user;
    },
  });
  const details = data ?? null;

  return (
    <UserDialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Détails de l'utilisateur"
      description="Informations du compte"
      footer={
        <>
          <CloseButton onClose={onClose} />
          {user && canManage && (
            <Button type="button" className="rounded-none bg-primaryColor text-white hover:bg-primaryDarkColor" onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              Modifier
            </Button>
          )}
        </>
      }
    >
      {user && (
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <UserAvatarImage user={details ?? user} className="h-16 w-16 text-lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-gray-900">{fullName(details ?? user)}</p>
            <p className="truncate text-sm text-gray-600">{(details ?? user).email ?? "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center bg-primaryColor/10 px-2 py-0.5 text-xs font-semibold text-primaryColor">
                {roleLabels[user.role] ?? user.role}
              </span>
              <StatusBadge active={(details ?? user).isActive} />
            </div>
          </div>
        </div>
      )}
      {isLoading && <Loader message="Chargement des informations…" className="py-10" />}
      {error && <ErrorNote message={(error as Error).message} />}
      {details && (
        <dl className="divide-y divide-gray-100">
          <Detail label="Prénom" value={details.firstName} />
          <Detail label="Nom" value={details.lastName} />
          <Detail label="Sexe" value={details.sexe ? sexeLabels[details.sexe] ?? details.sexe : null} />
          <Detail label="Téléphone" value={details.phone && <span className="tabular-nums">{details.phone}</span>} />
          <Detail label="Adresse" value={details.address} />
          <Detail
            label="Langues"
            value={details.nigerLanguage?.length ? details.nigerLanguage.map((l) => l.charAt(0) + l.slice(1).toLowerCase()).join(", ") : null}
          />
          <Detail label="Bio" value={details.bio && <span className="whitespace-pre-wrap font-normal">{details.bio}</span>} />
          <Detail label="Email vérifié" value={details.emailVerified ? formatDate(details.emailVerified) : "Non"} />
          <Detail label="Inscrit le" value={formatDate(details.createdAt)} />
          <Detail label="Modifié le" value={formatDate(details.updatedAt, true)} />
        </dl>
      )}
    </UserDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modifier                                                                   */
/* -------------------------------------------------------------------------- */

const optionalText = z.string().trim().max(100, "100 caractères maximum");
const EditUserSchema = z.object({
  firstName: optionalText,
  lastName: optionalText,
  email: z.string().trim().email("Adresse email invalide"),
  phone: z.string().trim().max(30, "30 caractères maximum"),
  role: z.string(),
});
type EditUserValues = z.infer<typeof EditUserSchema>;

export function EditUserDialog({
  open,
  user,
  roleOptions,
  onClose,
}: {
  open: boolean;
  user: UserListItem | null;
  roleOptions: Role[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<EditUserValues>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", role: "USER" },
  });

  const mutation = useUserAction(
    (values: EditUserValues) =>
      updateUser(user!.id, {
        firstName: values.firstName || null,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        ...(values.role !== user!.role && { role: values.role as Role }),
      }),
    {
      success: "Utilisateur modifié",
      onDone: () => {
        queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
        onClose();
      },
    }
  );

  useEffect(() => {
    if (open && user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role,
      });
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const canChangeRole = !!user && roleOptions.includes(user.role as Role);

  return (
    <UserDialog
      open={open}
      onClose={onClose}
      title="Modifier l'utilisateur"
      description={user ? fullName(user) : undefined}
      footer={
        <>
          <CloseButton onClose={onClose} />
          <Button
            type="submit"
            form="edit-user-form"
            loading={mutation.isPending}
            className="rounded-none bg-secondaryColor text-white hover:bg-[#c75f0f] sm:min-w-40"
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="edit-user-form"
          noValidate
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" className="rounded-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" className="rounded-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="off" className="rounded-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" autoComplete="off" className="rounded-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!canChangeRole}>
                  <FormControl>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(canChangeRole ? roleOptions : [field.value as Role]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabels[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <ErrorNote message={mutation.error?.message} />
    </UserDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Changer le mot de passe                                                    */
/* -------------------------------------------------------------------------- */

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne correspondent pas",
  });
type PasswordValues = z.infer<typeof PasswordSchema>;

export function PasswordDialog({ open, user, onClose }: { open: boolean; user: UserListItem | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const form = useForm<PasswordValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const mutation = useUserAction((values: PasswordValues) => updateUserPassword(user!.id, values.password), {
    success: "Mot de passe modifié",
    onDone: onClose,
  });

  useEffect(() => {
    if (open && user) {
      form.reset({ password: "", confirm: "" });
      setVisible(false);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-gray-500 hover:text-gray-800"
      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <UserDialog
      open={open}
      onClose={onClose}
      title="Changer le mot de passe"
      description={user ? <>Nouveau mot de passe pour <strong>{fullName(user)}</strong>.</> : undefined}
      footer={
        <>
          <CloseButton onClose={onClose} />
          <Button
            type="submit"
            form="password-user-form"
            loading={mutation.isPending}
            className="rounded-none bg-secondaryColor text-white hover:bg-[#c75f0f] sm:min-w-40"
          >
            Changer le mot de passe
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="password-user-form"
          noValidate
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          {(["password", "confirm"] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{name === "password" ? "Nouveau mot de passe" : "Confirmer le mot de passe"}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        className="rounded-none pr-10"
                      />
                    </FormControl>
                    {toggle}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>
      <p className="mt-4 text-sm text-gray-500">
        L&apos;utilisateur sera déconnecté de tous ses appareils et devra se reconnecter avec ce nouveau mot de passe.
      </p>
      <ErrorNote message={mutation.error?.message} />
    </UserDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ajouter                                                                    */
/* -------------------------------------------------------------------------- */

const CreateUserFormSchema = CreateUserSchema.extend({ confirm: z.string() }).refine(
  (v) => v.password === v.confirm,
  { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas" }
);
type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;

/** Mot de passe aléatoire de 12 caractères (sans caractères ambigus). */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?";
  const values = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export function CreateUserDialog({
  open,
  roleOptions,
  onClose,
}: {
  open: boolean;
  roleOptions: Role[];
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const defaultRole = roleOptions.includes("USER") ? "USER" : roleOptions[0];
  const empty = { firstName: "", lastName: "", email: "", phone: "", role: defaultRole, password: "", confirm: "" };
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: empty,
  });

  const mutation = useUserAction(
    ({ confirm: _confirm, ...values }: CreateUserFormValues) => createUser(values),
    {
      success: "Utilisateur ajouté",
      celebrate: (v) => `Le compte de ${v.firstName} ${v.lastName} est actif : ${v.email} peut se connecter dès maintenant.`,
      onDone: onClose,
    }
  );

  useEffect(() => {
    if (open) {
      form.reset(empty);
      setVisible(false);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fillGenerated = () => {
    const password = generatePassword();
    form.setValue("password", password, { shouldValidate: true });
    form.setValue("confirm", password, { shouldValidate: true });
    setVisible(true);
  };

  const textField = (
    name: "firstName" | "lastName" | "email" | "phone",
    label: string,
    props: React.ComponentProps<typeof Input> = {},
    className?: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} autoComplete="off" className="rounded-none" {...props} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <UserDialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Ajouter un utilisateur"
      description="Le compte est actif dès sa création : communiquez le mot de passe à son titulaire."
      footer={
        <>
          <CloseButton onClose={onClose} />
          <Button
            type="submit"
            form="create-user-form"
            loading={mutation.isPending}
            className="rounded-none bg-secondaryColor text-white hover:bg-[#c75f0f] sm:min-w-40"
          >
            Ajouter l&apos;utilisateur
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="create-user-form"
          noValidate
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          {textField("firstName", "Prénom")}
          {textField("lastName", "Nom")}
          {textField("email", "Email", { type: "email" }, "sm:col-span-2")}
          {textField("phone", "Téléphone (facultatif)", { type: "tel" })}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabels[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:col-span-2">
            <p className="text-sm font-semibold text-gray-900">Identifiants de connexion</p>
            <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={fillGenerated}>
              <KeyRound className="mr-1.5 h-4 w-4" aria-hidden />
              Générer
            </Button>
          </div>
          {(["password", "confirm"] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{name === "password" ? "Mot de passe" : "Confirmer le mot de passe"}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        className="rounded-none pr-10 font-mono"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setVisible((v) => !v)}
                      className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-gray-500 hover:text-gray-800"
                      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>
      <ErrorNote message={mutation.error?.message} />
    </UserDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirmations : réinitialisation, activation, suppression                 */
/* -------------------------------------------------------------------------- */

function ConfirmDialog({
  open,
  user,
  onClose,
  title,
  icon: Icon,
  tone,
  description,
  confirmLabel,
  mutation,
}: {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  tone: "primary" | "danger";
  description: React.ReactNode;
  confirmLabel: string;
  mutation: { mutate: (id: string) => void; isPending: boolean; error: Error | null };
}) {
  return (
    <UserDialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <CloseButton onClose={onClose} />
          <Button
            type="button"
            loading={mutation.isPending}
            onClick={() => user && mutation.mutate(user.id)}
            className={cn(
              "rounded-none text-white sm:min-w-40",
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-primaryColor hover:bg-primaryDarkColor"
            )}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-primaryColor/10 text-primaryColor"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="text-sm leading-relaxed text-gray-700">{description}</div>
      </div>
      <ErrorNote message={mutation.error?.message} />
    </UserDialog>
  );
}

export function ResetPasswordDialog({ open, user, onClose }: { open: boolean; user: UserListItem | null; onClose: () => void }) {
  const mutation = useUserAction((id: string) => sendUserPasswordReset(id), {
    success: `Lien de réinitialisation envoyé à ${user?.email ?? "l'utilisateur"}`,
    onDone: onClose,
  });
  useEffect(() => mutation.reset(), [open, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ConfirmDialog
      open={open}
      user={user}
      onClose={onClose}
      title="Réinitialiser le mot de passe"
      icon={Mail}
      tone="primary"
      confirmLabel="Envoyer le lien"
      mutation={mutation}
      description={
        <>
          <p>
            Un email contenant un lien pour choisir un nouveau mot de passe sera envoyé à{" "}
            <strong className="break-all">{user?.email}</strong>.
          </p>
          <p className="mt-2 text-gray-500">Le lien est valable 1 heure. Le mot de passe actuel reste valable tant que le lien n&apos;a pas été utilisé.</p>
        </>
      }
    />
  );
}

export function ToggleActiveDialog({ open, user, onClose }: { open: boolean; user: UserListItem | null; onClose: () => void }) {
  const activating = !!user && !user.isActive;
  const mutation = useUserAction((id: string) => updateUser(id, { isActive: activating }), {
    success: activating ? "Compte activé" : "Compte désactivé",
    onDone: onClose,
  });
  useEffect(() => mutation.reset(), [open, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ConfirmDialog
      open={open}
      user={user}
      onClose={onClose}
      title={activating ? "Activer le compte" : "Désactiver le compte"}
      icon={Power}
      tone={activating ? "primary" : "danger"}
      confirmLabel={activating ? "Activer" : "Désactiver"}
      mutation={mutation}
      description={
        activating ? (
          <p>
            <strong>{user && fullName(user)}</strong> pourra de nouveau se connecter à la plateforme.
          </p>
        ) : (
          <p>
            <strong>{user && fullName(user)}</strong> sera déconnecté de tous ses appareils et ne pourra plus se
            connecter tant que le compte n&apos;est pas réactivé.
          </p>
        )
      }
    />
  );
}

export function DeleteUserDialog({ open, user, onClose }: { open: boolean; user: UserListItem | null; onClose: () => void }) {
  const mutation = useUserAction((id: string) => deleteUser(id), {
    success: "Utilisateur supprimé",
    onDone: onClose,
  });
  useEffect(() => mutation.reset(), [open, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ConfirmDialog
      open={open}
      user={user}
      onClose={onClose}
      title="Supprimer l'utilisateur"
      icon={Trash2}
      tone="danger"
      confirmLabel="Supprimer"
      mutation={mutation}
      description={
        <>
          <p>
            Voulez-vous supprimer le compte de <strong>{user && fullName(user)}</strong> ?
          </p>
          <p className="mt-2 text-gray-500">
            Le compte sera désactivé et retiré de la liste, mais ses données sont conservées en base.
          </p>
        </>
      }
    />
  );
}

