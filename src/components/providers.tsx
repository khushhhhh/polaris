"use client";

import { 
  Authenticated, 
  Unauthenticated,
  ConvexReactClient,
  AuthLoading, 
} from "convex/react";
import { usePathname } from "next/navigation";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { UnauthenticatedView } from "@/features/auth/components/unauthenticated-view";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";

import { ThemeProvider } from "./theme-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
         <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {isAuthRoute ? (
            children
          ) : (
            <>
              <Authenticated>
                {children}
              </Authenticated>
              <Unauthenticated>
                <UnauthenticatedView />
              </Unauthenticated>
              <AuthLoading>
                <AuthLoadingView />
              </AuthLoading>
            </>
          )}
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
