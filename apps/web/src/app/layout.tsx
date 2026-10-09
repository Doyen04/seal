import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "cn";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
});

export const metadata: Metadata = {
    title: "Seal | Developer Secrets Manager",
    description: "Secure, developer-first secrets vault and environment sync",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
            >
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                    {children}
                    {/* Sonner pins mobile toasts to the top at 16px, which lands them
                        on top of the 64px sticky navbar. 5rem clears it. */}
                    <Toaster position="top-right" offset={{ top: "5rem" }} richColors />
                </ThemeProvider>
            </body>
        </html>
    );
}
