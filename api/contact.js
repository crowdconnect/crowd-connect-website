const nodemailer = require("nodemailer");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
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
      return res.status(400).json({
        error: "Name, E-Mail, Thema und Nachricht sind erforderlich.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Ungueltiges E-Mail-Format." });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res
        .status(500)
        .json({ error: "Server E-Mail-Konfigurationsfehler." });
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

    return res.status(200).json({ message: "E-Mail erfolgreich gesendet." });
  } catch (error) {
    console.error("Vercel contact API error:", error);
    return res.status(500).json({ error: "Interner Serverfehler." });
  }
};
