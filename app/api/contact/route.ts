import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || body.bar || "").trim();
    const email = (body.email || "").trim();
    const topic = (body.topic || "Crowd.Connect Pilotanfrage").trim();
    const company = (body.company || body.city || "").trim();
    const note = (body.note || "").trim();
    const message = (
      body.message ||
      `Stadt: ${company}${note ? `\n\nNachricht:\n${note}` : ""}`
    ).trim();

    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { error: "Name, E-Mail, Thema und Nachricht sind erforderlich." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ungueltiges E-Mail-Format." },
        { status: 400 }
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: "Server E-Mail-Konfigurationsfehler." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Neue Kontaktanfrage von ${name} - ${topic}`,
      html: `
        <h2>Neue Kontaktanfrage ueber Crowd.Connect</h2>
        <p><strong>Name / Location:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Stadt / Unternehmen:</strong> ${company || "Nicht angegeben"}</p>
        <p><strong>Thema:</strong> ${topic}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>Diese Nachricht wurde ueber das Crowd.Connect Kontaktformular gesendet.</small></p>
      `,
    });

    return NextResponse.json({ message: "E-Mail erfolgreich gesendet." });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
