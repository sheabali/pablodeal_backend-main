import { Heading, Section, Text } from "react-email";

import { Button } from "../components/Button";
import { EmailLayout } from "../components/EmailLayout";

export interface VerifyEmailProps {
  companyName: string;
  verifyUrl: string;
  expiryMinutes: number;
  logoUrl?: string;
}

export function VerifyEmail({
  companyName,
  verifyUrl,
  expiryMinutes,
  logoUrl,
}: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your email address"
      companyName={companyName}
      logoUrl={logoUrl}
    >
      <Heading
        as="h1"
        className="m-0 mb-5 text-center text-[32px] font-bold text-fg"
      >
        Verify your email
      </Heading>

      <Text className="mx-auto mb-8 mt-0 max-w-[420px] text-center text-[16px] leading-7 text-fg-2">
        Welcome to {companyName}! To complete your account registration, click
        the button below.
      </Text>

      <Section className="mb-6 text-center">
        <Button href={verifyUrl}>Verify Email</Button>
      </Section>

      <Text className="mx-auto mb-4 max-w-[420px] text-center text-[15px] leading-7 text-fg-2">
        This link will expire in <strong>{expiryMinutes} minutes</strong>.
      </Text>

      <Text className="mx-auto mb-0 max-w-[420px] text-center text-[15px] leading-7 text-fg-2">
        For your security, never share this link with anyone. Our team will
        never ask for it.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  companyName: "Acme",
  verifyUrl:
    "https://app.acme.com/verify-email?token=abc123&email=user@acme.com",
  expiryMinutes: 15,
} satisfies VerifyEmailProps;

export default VerifyEmail;
