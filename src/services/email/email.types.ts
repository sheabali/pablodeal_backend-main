import type { ResetPasswordEmailProps } from "./templates/ResetPasswordEmail";
import type { VerifyEmailProps } from "./templates/VerifyEmail";
import type { WelcomeEmailProps } from "./templates/WelcomeEmail";

export type { WelcomeEmailProps, VerifyEmailProps, ResetPasswordEmailProps };

export type EmailTemplateName = "welcome" | "verify-email" | "reset-password";

export type EmailTemplatePropsMap = {
  welcome: WelcomeEmailProps;
  "verify-email": VerifyEmailProps;
  "reset-password": ResetPasswordEmailProps;
};

type WelcomeJobPayload = {
  template: "welcome";
  props: WelcomeEmailProps;
};

type VerifyJobPayload = {
  template: "verify-email";
  props: VerifyEmailProps;
};

type ResetJobPayload = {
  template: "reset-password";
  props: ResetPasswordEmailProps;
};

export type EmailJobPayload =
  WelcomeJobPayload | VerifyJobPayload | ResetJobPayload;
