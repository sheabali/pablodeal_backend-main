export { EmailLayout } from "./components/EmailLayout";
export { Header } from "./components/Header";
export { Footer } from "./components/Footer";
export { Button } from "./components/Button";

export { WelcomeEmail } from "./templates/WelcomeEmail";
export { VerifyEmail } from "./templates/VerifyEmail";
export { ResetPasswordEmail } from "./templates/ResetPasswordEmail";

export { sendEmail } from "./email.service";
export { renderEmailToHtml, renderEmailToPlainText } from "./email.renderer";
export { EMAIL_CONFIG } from "./email.constants";

export { emailQueue } from "./email.queue";
export { setupEmailWorker } from "./email.jobs";

export type {
  WelcomeEmailProps,
  VerifyEmailProps,
  ResetPasswordEmailProps,
  EmailTemplateName,
  EmailJobPayload,
} from "./email.types";

export type { EmailJobData } from "./email.queue";
