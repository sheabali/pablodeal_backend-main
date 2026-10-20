# Email Service

A React Email-based system for transactional emails using Nodemailer.

## Folder Structure

```
src/services/email/
├── components/          # Reusable UI components (EmailLayout, Header, Footer, Button)
├── templates/           # Email templates (WelcomeEmail, VerifyEmail, ResetPasswordEmail)
├── providers/           # Nodemailer SMTP client
├── email.constants.ts   # Company config, social links, from address
├── email.renderer.ts    # Renders JSX → HTML and plain text
├── email.service.ts     # Orchestrates rendering + sending (synchronous path)
├── email.queue.ts       # BullMQ queue definition (async/background path)
├── email.jobs.ts        # BullMQ worker that renders + sends queued emails
├── email.types.ts       # Shared TypeScript types
└── index.ts             # Public API exports
```

## Requirements

SMTP credentials configured via environment variables:

| Variable    | Default     | Description              |
| ----------- | ----------- | ------------------------ |
| `SMTP_HOST` | `localhost` | SMTP server hostname     |
| `SMTP_PORT` | `587`       | SMTP server port         |
| `SMTP_USER` | _(empty)_   | SMTP username (optional) |
| `SMTP_PASS` | _(empty)_   | SMTP password (optional) |

When `SMTP_USER` and `SMTP_PASS` are empty, no authentication is used (suitable for local development with Mailpit, MailHog, etc.).

## Usage

```ts
import { sendEmail } from "@/services/email";

await sendEmail("user@example.com", "Welcome to My App", "welcome", {
  companyName: "My App",
  userName: "Jane",
});
```

### Available templates

| Template       | Key              | Props                                                  |
| -------------- | ---------------- | ------------------------------------------------------ |
| Welcome Email  | `welcome`        | `companyName`, `userName`, `dashboardUrl`              |
| Verify Email   | `verify-email`   | `companyName`, `otp`, `expiryMinutes`                  |
| Reset Password | `reset-password` | `companyName`, `userName`, `resetUrl`, `expiryMinutes` |

All templates accept an optional `logoUrl` prop.

### Rendering only (no send)

```ts
import { createElement } from "react";

import { renderEmailToHtml, renderEmailToPlainText, WelcomeEmail } from "@/services/email";

const html = await renderEmailToHtml(
  createElement(WelcomeEmail, { companyName: "Acme", userName: "Jane" }),
);
```

## Local preview

```sh
bun run email
```

Opens a browser at `http://localhost:3001` with live preview of all templates.

## Background queue (BullMQ)

Enqueue email jobs for async delivery:

```ts
import { emailQueue } from "@/services/email";

await emailQueue.add("send-welcome-email", {
  to: "user@example.com",
  subject: "Welcome!",
  template: "welcome",
  props: { companyName: "Acme", userName: "Jane", dashboardUrl: "https://app.acme.com" },
});
```

The worker (`src/services/email/email.jobs.ts`) is started via `src/worker.ts` and processes jobs with 3 retry attempts and exponential backoff.

## Adding a new template

1. Create a file in `templates/` (e.g. `MagicLinkEmail.tsx`)
2. Define and export props interface + component function
3. Add `PreviewProps` for the dev preview
4. Register it in `email.types.ts` (add to `EmailTemplateName` union and `EmailTemplatePropsMap`)
5. Register it in `email.service.ts` and `email.jobs.ts` (add to `templateComponentMap` in both)
6. Call `sendEmail(to, subject, "magic-link", { ... })` or enqueue via `emailQueue`

## Architecture

```
## Synchronous path (sendEmail)
sendEmail(to, subject, template, props)
  → createElement(Component, props)
  → renderEmailToHtml(element)     // react-email render
  → renderEmailToPlainText(element) // @react-email/render plaintext
  → sendEmailViaProvider({ from, to, subject, html, text })
    → nodemailer transporter.sendMail()

## Background path (email queue)
emailQueue.add(jobName, { to, subject, template, props })
  → BullMQ queue → Redis
  → email worker picks up the job
  → createElement(Component, props)
  → renderEmailToHtml + renderEmailToPlainText
  → sendEmailViaProvider()
    → nodemailer transporter.sendMail()
```

The templates are self-contained — they only import `react-email` components and the shared UI components. No backend modules (config, database, services) are imported inside templates.
