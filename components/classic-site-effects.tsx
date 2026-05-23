"use client";

import { useEffect } from "react";

function loadScript(src: string, id: string) {
  if (document.querySelector(`script[data-cc-script="${id}"]`)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.ccScript = id;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

async function waitForSelector(selector: string, maxFrames = 80) {
  for (let i = 0; i < maxFrames; i += 1) {
    if (document.querySelector(selector)) {
      return true;
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  return false;
}

export function ClassicSiteEffects() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const revealTargets = Array.from(
        document.querySelectorAll<HTMLElement>("main section > .container")
      );

      revealTargets.forEach((el, index) => {
        el.classList.add("motion-reveal");
        el.style.setProperty(
          "--reveal-delay",
          `${Math.min(index % 3, 2) * 80}ms`
        );
      });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.18,
          rootMargin: "0px 0px -10% 0px",
        }
      );

      revealTargets.forEach((el) => observer?.observe(el));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const form = document.getElementById("pilotForm") as HTMLFormElement | null;
    const successEl = document.getElementById("pilotSuccess");
    const statusEl = document.getElementById("pilotFormStatus");
    if (!form || !successEl || !statusEl) {
      return;
    }

    const onSubmit = async (e: Event) => {
      e.preventDefault();

      const barEl = form.elements.namedItem("bar") as HTMLInputElement;
      const cityEl = form.elements.namedItem("city") as HTMLInputElement;
      const emailEl = form.elements.namedItem("email") as HTMLInputElement;
      const noteEl = form.elements.namedItem("note") as HTMLTextAreaElement;
      const submitBtn = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]'
      );

      let valid = true;
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");

      [barEl, cityEl, emailEl].forEach((el) => {
        el.classList.remove("is-error");
        el.removeAttribute("aria-invalid");
        if (!el.value.trim()) {
          el.classList.add("is-error");
          el.setAttribute("aria-invalid", "true");
          valid = false;
        }
      });

      if (
        emailEl.value.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())
      ) {
        emailEl.classList.add("is-error");
        emailEl.setAttribute("aria-invalid", "true");
        valid = false;
      }

      if (!valid) {
        statusEl.textContent = "Bitte pruefe die markierten Felder.";
        statusEl.classList.add("is-error");
        return;
      }

      const payload = {
        bar: barEl.value.trim(),
        city: cityEl.value.trim(),
        email: emailEl.value.trim(),
        note: noteEl.value.trim(),
        topic: "Crowd.Connect Pilotanfrage",
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add("is-loading");
        }
        statusEl.textContent = "Anfrage wird gesendet...";

        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ||
              "Ein Fehler ist aufgetreten."
          );
        }

        form.hidden = true;
        successEl.hidden = false;
        requestAnimationFrame(() => {
          successEl.classList.add("is-visible");
        });
      } catch (err) {
        statusEl.textContent =
          err instanceof Error
            ? err.message
            : "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
        statusEl.classList.add("is-error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
        }
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      await waitForSelector("#navBurger");
      if (cancelled) return;
      await loadScript("/scripts/nav-mobile.js", "nav-mobile");

      await waitForSelector("#demo-tv-screen");
      if (cancelled) return;
      await loadScript("/scripts/demo-live.js", "demo-live");

      await waitForSelector("#cc-banner");
      if (cancelled) return;
      await loadScript("/scripts/consent.js", "consent");
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
