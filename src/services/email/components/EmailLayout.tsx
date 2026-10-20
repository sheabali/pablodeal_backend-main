import { ReactNode } from "react";
import { Body, Container, Html, Preview, Section, Tailwind } from "react-email";

import { Footer } from "./Footer";
import { Header } from "./Header";

interface EmailLayoutProps {
  preview: string;
  companyName: string;
  logoUrl?: string;
  children: ReactNode;
}

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        "bg-2": "#f9fafb",
        fg: "#111827",
        "fg-2": "#6b7280",
        "fg-3": "#9ca3af",
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        border: "#e5e7eb",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export function EmailLayout({
  preview,
  companyName,
  logoUrl,
  children,
}: EmailLayoutProps) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html>
        <Preview>{preview}</Preview>

        <Body className="m-0 bg-bg-2 font-sans text-center">
          <Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-[640px]">
            <Section>
              <Section className="bg-bg mobile:px-2 px-6 py-4">
                <Header companyName={companyName} logoUrl={logoUrl} />

                <Section className="mobile:px-6 mobile:py-12 rounded-[8px] bg-bg-2 px-10 py-16">
                  {children}
                </Section>

                <Footer companyName={companyName} logoUrl={logoUrl} />
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
