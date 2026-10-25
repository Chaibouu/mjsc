import { Poppins } from "next/font/google";
import { AuthMobileBrand } from "@/components/auth/auth-brand-panel";

import { cn } from "@/lib/utils";
import appConfig from "@/settings";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

interface HeaderProps {
  label: string;
};

export const Header = ({
  label,
}: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center text-center">
      {/* Téléphone : armoiries, République du Niger et nom du ministère */}
      <AuthMobileBrand className="mb-0" />
      {/* À partir de la tablette : nom du ministère en titre */}
      <h1 className={cn(
        "hidden md:block text-3xl font-semibold",
        font.className,
      )}>
         {appConfig.appName}
      </h1>
      <p className="text-muted-foreground text-sm">
        {label}
      </p>
    </div>
  );
};
