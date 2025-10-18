import type { ComponentPropsWithoutRef } from "react";
import type { Language, LocalizedText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type HeadingProps = ComponentPropsWithoutRef<"h2"> & {
  text: LocalizedText;
  language: Language;
};

export function LocalizedHeading({
  text,
  language,
  className,
  ...props
}: HeadingProps) {
  return (
    <h2
      {...props}
      className={className}
    >
      {language === "en" ? text.en : text.zh}
    </h2>
  );
}

type ParagraphProps = ComponentPropsWithoutRef<"p"> & {
  text: LocalizedText;
  language: Language;
  align?: "left" | "center";
};

export function LocalizedParagraph({
  text,
  language,
  className,
  align = "left",
  ...props
}: ParagraphProps) {
  return (
    <p
      {...props}
      className={cn(
        "leading-relaxed",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {language === "en" ? text.en : text.zh}
    </p>
  );
}
