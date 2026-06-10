import { GlobalBackdrop } from "@app/components/GlobalBackdrop";
import { Grain } from "@app/components/Grain";
import { SmoothScroll } from "@app/components/SmoothScroll";
import { Divider } from "@app/components/Divider";
import { useT } from "@app/i18n";
import { Nav } from "@app/sections/Nav";
import { Hero } from "@app/sections/Hero";
import { Marquee } from "@app/sections/Marquee";
import { Collection } from "@app/sections/Collection";
import { Craft } from "@app/sections/Craft";
import { Bespoke } from "@app/sections/Bespoke";
import { Enquiry } from "@app/sections/Enquiry";
import { Footer } from "@app/sections/Footer";

export function App() {
  const { t } = useT();
  return (
    <>
      <GlobalBackdrop />
      <Grain />
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Divider kicker={t("collection.eyebrow")} />
        <Collection />
        <Divider kicker={t("craft.eyebrow")} />
        <Craft />
        <Divider kicker={t("bespoke.eyebrow")} />
        <Bespoke />
        <Divider kicker={t("enquiry.eyebrow")} />
        <Enquiry />
      </main>
      <Footer />
    </>
  );
}
