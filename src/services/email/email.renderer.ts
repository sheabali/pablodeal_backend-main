import type { ReactElement } from "react";
import { render } from "react-email";

export async function renderEmailToHtml(
  element: ReactElement,
): Promise<string> {
  return render(element);
}

export async function renderEmailToPlainText(
  element: ReactElement,
): Promise<string> {
  const { render: renderToText } = await import("@react-email/render");
  return renderToText(element, { plainText: true });
}
