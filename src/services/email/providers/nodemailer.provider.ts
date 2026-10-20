import nodemailer from "nodemailer";

import { config } from "@/core/config";

let transporter: nodemailer.Transporter;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = config.email;

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }
  return transporter;
}

export interface SendEmailViaProviderOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailViaProvider(
  options: SendEmailViaProviderOptions,
) {
  const t = getTransporter();

  const info = await t.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return info;
}
