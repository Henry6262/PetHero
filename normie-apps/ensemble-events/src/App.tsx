import { Grain } from "@app/components/Grain";
import { Divider } from "@app/components/Divider";
import { Nav } from "@app/sections/Nav";
import { Hero } from "@app/sections/Hero";
import { Wedge } from "@app/sections/Wedge";
import { Services } from "@app/sections/Services";
import { Brigade } from "@app/sections/Brigade";
import { BeforeAfter } from "@app/sections/BeforeAfter";
import { Portfolio } from "@app/sections/Portfolio";
import { Stats } from "@app/sections/Stats";
import { Proof } from "@app/sections/Proof";
import { Process } from "@app/sections/Process";
import { Contact } from "@app/sections/Contact";
import { Footer } from "@app/sections/Footer";

export function App() {
  return (
    <>
      <Grain />
      <Nav />
      <main>
        <Hero />

        <Divider numeral="I" kicker="The difference" tone="espresso" />
        <Wedge />

        <Divider numeral="II" kicker="The house" tone="cream" />
        <Services />

        <Divider numeral="III" kicker="The brigade" tone="espresso" />
        <Brigade />

        <Divider numeral="IV" kicker="Transformation" tone="cream" />
        <BeforeAfter />

        <Divider numeral="V" kicker="Selected work" tone="cream" />
        <Portfolio />

        <Divider numeral="VI" kicker="In numbers" tone="espresso" />
        <Stats />

        <Divider numeral="VII" kicker="In confidence" tone="cream" />
        <Proof />

        <Divider numeral="VIII" kicker="The method" tone="espresso" />
        <Process />

        <Divider numeral="IX" kicker="Begin" tone="espresso" />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
