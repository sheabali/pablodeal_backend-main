import { Button as EmailButton } from "react-email";

interface ButtonProps {
  href: string;
  children: string;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      className="box-border w-full rounded-[8px] bg-primary px-5 py-3 text-center text-[16px] font-semibold text-white no-underline"
    >
      {children}
    </EmailButton>
  );
}
