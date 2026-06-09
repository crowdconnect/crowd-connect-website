"use client";

import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function ProductScrollSection() {
  return (
    <section
      id="product-preview"
      className="product-scroll-section bg-[#0A0E18]"
      aria-label="Produktvorschau"
    >
      <ContainerScroll
        compact
        titleComponent={
          <p className="kicker-mono">Dashboard · Gäste-App · TV-Screen</p>
        }
      >
        <Image
          src="/cc-front-page-image.png"
          alt="Crowd.Connect App: Restaurant Floor Plan auf dem Tablet, Cross-Table-Chat auf dem Smartphone"
          fill
          className="object-cover object-center"
          draggable={false}
          priority
          sizes="(max-width: 768px) 100vw, 864px"
        />
      </ContainerScroll>
    </section>
  );
}
