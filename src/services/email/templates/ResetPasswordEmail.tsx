import { Heading, Section, Text } from "react-email";

import { Button } from "../components/Button";
import { EmailLayout } from "../components/EmailLayout";

export interface ResetPasswordEmailProps {
  companyName: string;
  userName: string;
  resetUrl: string;
  expiryMinutes: number;
  logoUrl?: string;
}

export function ResetPasswordEmail({
  companyName,
  userName,
  resetUrl,
  expiryMinutes,
  logoUrl,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview={`Reset your ${companyName} password`}
      companyName={companyName}
      logoUrl={logoUrl}
    >
      <Heading
        as="h1"
        className="m-0 mb-5 text-center text-[32px] font-bold text-fg"
      >
        Reset your password
      </Heading>

      <Text className="mx-auto mb-4 mt-0 max-w-[420px] text-center text-[16px] leading-7 text-fg-2">
        Hi {userName}, we received a request to reset the password for your{" "}
        {companyName} account. Click the button below to create a new password.
      </Text>

      <Section className="mb-6 text-center">
        <Button href={resetUrl}>Reset Password</Button>
      </Section>

      <Text className="mx-auto mb-4 max-w-[420px] text-center text-[15px] leading-7 text-fg-2">
        This link will expire in <strong>{expiryMinutes} minutes</strong>.
      </Text>

      <Text className="mx-auto mb-0 max-w-[420px] text-center text-[15px] leading-7 text-fg-2">
        If you didn't request a password reset, you can safely ignore this
        email. Your password will remain unchanged.
      </Text>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  companyName: "Acme",
  userName: "Jane",
  resetUrl: "https://app.acme.com/reset-password?token=abc123",
  expiryMinutes: 30,
} satisfies ResetPasswordEmailProps;

export default ResetPasswordEmail;
