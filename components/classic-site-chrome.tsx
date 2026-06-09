import { readFileSync } from "fs";
import path from "path";
import { ClassicBodyContent } from "@/components/classic-body-content";
import { ClassicHero } from "@/components/classic-hero";
import { ClassicNav } from "@/components/classic-nav";
import { ClassicSiteEffects } from "@/components/classic-site-effects";
import { ProductChoiceSection } from "@/components/product-choice-section";
import { ProductScrollSection } from "@/components/product-scroll-section";

function readFragment(name: string) {
  return readFileSync(
    path.join(process.cwd(), "public", "fragments", name),
    "utf8"
  ).replace(/\r\n/g, "\n");
}

export function ClassicSiteChrome() {
  const navHtml = readFragment("nav.html");
  const bodyHtml = readFragment("body-content.html");

  return (
    <>
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>

      <ClassicNav html={navHtml} />

      <main id="main-content">
        <ClassicHero />
        <ProductChoiceSection />
        <ProductScrollSection />
        <ClassicBodyContent html={bodyHtml} />
      </main>

      <ClassicSiteEffects />
    </>
  );
}
