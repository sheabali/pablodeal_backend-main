import { Column, Img, Row, Section, Text } from "react-email";

interface HeaderProps {
  companyName: string;
  logoUrl?: string;
}

export function Header({ companyName, logoUrl }: HeaderProps) {
  return (
    <Section className="mb-3 px-6">
      <Row>
        <Column className="w-1/2 py-[7px] align-middle">
          <Img
            src={logoUrl ?? "https://placehold.co/40x40"}
            alt={companyName}
            width={40}
            height={40}
          />
        </Column>
        <Column align="right" className="w-1/2 py-[7px] align-middle">
          <Text className="font-13 m-0 text-right text-fg-3">
            {companyName}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
