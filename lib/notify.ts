import { toast } from "sonner";

/** Notifications des formulaires et tableaux du tableau de bord (vert = succès, rouge = erreur). */
export const notify = {
  success: (message: string) =>
    toast(message, {
      position: "top-right",
      style: { backgroundColor: "#0eda0e", color: "white" },
    }),
  error: (message: string) =>
    toast(`Erreur : ${message}`, {
      position: "top-right",
      style: { backgroundColor: "#f03e3e", color: "white" },
    }),
};
