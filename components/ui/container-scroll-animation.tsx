"use client";

import React, { useRef } from "react";
import {
  useScroll,
  useTransform,
  useReducedMotion,
  motion,
  MotionValue,
} from "framer-motion";

const TILT_DEGREES = 28;

export const ContainerScroll = ({
  titleComponent,
  children,
  compact = false,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
  /** Tighter layout when embedded directly under the hero */
  compact?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: compact
      ? ["start end", "end 0.35"]
      : ["start end", "end start"],
  });

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const startTilt = prefersReducedMotion ? 0 : TILT_DEGREES;
  const progressRange = compact ? [0, 0.85, 1] : [0, 1];
  const rotateRange = compact
    ? [startTilt, 0, 0]
    : [startTilt, 0];
  const scaleStart = prefersReducedMotion ? 1 : isMobile ? 0.92 : 1.04;

  const rotate = useTransform(scrollYProgress, progressRange, rotateRange);
  const scale = useTransform(
    scrollYProgress,
    progressRange,
    compact
      ? [scaleStart, 1, 1]
      : prefersReducedMotion
        ? [1, 1]
        : [scaleStart, 1]
  );
  const translate = useTransform(
    scrollYProgress,
    progressRange,
    compact ? [0, -32, -32] : [0, -100]
  );

  return (
    <div
      className={
        compact
          ? "relative flex h-[40rem] items-start justify-center p-2 pt-0 md:h-[46rem] md:p-4 md:pt-0"
          : "relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20"
      }
      ref={containerRef}
    >
      <div
        className={
          compact
            ? "relative w-full py-0"
            : "relative w-full py-10 md:py-40"
        }
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale} compact={compact}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="mx-auto max-w-[54rem] text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  compact = false,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
  compact?: boolean;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        transformPerspective: 1000,
        transformOrigin: "center bottom",
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className={
        compact
          ? "mx-auto mt-0 w-full max-w-[54rem] rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-2 shadow-2xl md:p-3"
          : "mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-2 shadow-2xl md:h-[40rem] md:p-6"
      }
    >
      <div
        className={
          compact
            ? "relative aspect-[1760/1357] w-full overflow-hidden rounded-[22px] bg-[#0f1117]"
            : "h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4"
        }
      >
        {children}
      </div>
    </motion.div>
  );
};
