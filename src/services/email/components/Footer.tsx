import { Column, Hr, Img, Link, Row, Section, Text } from "react-email";

interface FooterProps {
  companyName: string;
  logoUrl?: string;
}

const socialLinks = [
  { label: "X (Twitter)", url: "https://x.com" },
  { label: "LinkedIn", url: "https://linkedin.com" },
  { label: "GitHub", url: "https://github.com" },
];

export function Footer({ companyName, logoUrl }: FooterProps) {
  return (
    <Section className="bg-bg px-6 py-8 text-center">
      <Hr className="mx-0 mb-6 w-full border border-solid border-border" />

      <Row>
        <Column className="text-center">
          <Img
            src={logoUrl ?? "https://placehold.co/40x40"}
            alt={companyName}
            width={32}
            height={32}
            className="mx-auto mb-2 inline-block"
          />
          <Text className="font-13 m-0 mb-1 text-fg-3">{companyName}</Text>
        </Column>
      </Row>

      <Row className="mb-4">
        <Column className="text-center">
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.url}
              className="font-13 mx-2 text-fg-3 no-underline"
            >
              {link.label}
            </Link>
          ))}
        </Column>
      </Row>

      <Row>
        <Column className="text-center">
          <Text className="font-11 m-0 text-fg-3">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
