import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-ip";

    // Rate limit: 5 contact messages per 10 minutes per IP
    const allowed = await checkRateLimit(ip, "public_contact", 5, 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait a few minutes before submitting another inquiry." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, category, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please fill out all required fields: name, email, and message." },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "vineetkpe@gmail.com";
    const selectedCategory = category || "General";

    const emailSubject = `[Contact Inquiry - ${selectedCategory}] Message from ${name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="color: #7c3aed; margin-top: 0;">New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
        <p><strong>Category:</strong> ${selectedCategory}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; color: #18181b;">
          ${message}
        </div>
        <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
        <p style="font-size: 12px; color: #71717a;">Sent via HeyDrona Platform Public Contact Form.</p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for getting in touch! We have received your inquiry and will respond shortly.",
    });
  } catch (error) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while sending your message. Please try again or email support directly." },
      { status: 500 }
    );
  }
}
