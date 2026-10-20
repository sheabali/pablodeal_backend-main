import { createElement } from "react";

import { EMAIL_CONFIG } from "./email.constants";
import { renderEmailToHtml, renderEmailToPlainText } from "./email.renderer";
import type {
  EmailJobPayload,
  EmailTemplateName,
  EmailTemplatePropsMap,
} from "./email.types";
import { sendEmailViaProvider } from "./providers/nodemailer.provider";
import { ResetPasswordEmail } from "./templates/ResetPasswordEmail";
import { VerifyEmail } from "./templates/VerifyEmail";
import { WelcomeEmail } from "./templates/WelcomeEmail";

function renderEmail(payload: EmailJobPayload) {
  switch (payload.template) {
    case "welcome":
      return createElement(WelcomeEmail, payload.props);
    case "verify-email":
      return createElement(VerifyEmail, payload.props);
    case "reset-password":
      return createElement(ResetPasswordEmail, payload.props);
  }
}

export async function sendEmail<T extends EmailTemplateName>(
  to: string,
  subject: string,
  template: T,
  props: EmailTemplatePropsMap[T],
) {
  const element = renderEmail({
    template,
    props,
  } as unknown as EmailJobPayload);

  const [html, text] = await Promise.all([
    renderEmailToHtml(element),
    renderEmailToPlainText(element),
  ]);

  return sendEmailViaProvider({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html,
    text,
  });
}
