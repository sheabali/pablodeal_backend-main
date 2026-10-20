import { Worker } from "bullmq";
import { createElement } from "react";

import { redisConfig } from "@/core/database/redis";

import { EMAIL_CONFIG } from "./email.constants";
import type { EmailJobData } from "./email.queue";
import { renderEmailToHtml, renderEmailToPlainText } from "./email.renderer";
import type { EmailJobPayload } from "./email.types";
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

export const setupEmailWorker = () => {
  new Worker<EmailJobData>(
    "email",
    async (job) => {
      const { to, subject, ...payload } = job.data;

      const element = renderEmail(payload);

      const [html, text] = await Promise.all([
        renderEmailToHtml(element),
        renderEmailToPlainText(element),
      ]);

      await sendEmailViaProvider({
        from: EMAIL_CONFIG.from,
        to,
        subject,
        html,
        text,
      });
    },
    {
      connection: redisConfig,
    },
  );
};
