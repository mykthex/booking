import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js";

export async function sendConfirmationEmail(user, url, token) {
  const mailgun = new Mailgun(FormData);

  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_SECRET_KEY || "your-mailgun-api-key-here"
  });
  try {
    const data = await mg.messages.create(
      "sandbox6b13761671614a74bc032445f4e3b109.mailgun.org",
      {
        from: "Mailgun Sandbox <postmaster@sandbox6b13761671614a74bc032445f4e3b109.mailgun.org>",
        to: [`${user.name} ${user.surname} <${user.email}>`],
        subject: `Hello ${user.name} ${user.surname}`,
        text: `Thanks for subscribing ${user.name} ${user.surname}, please confirm your email by clicking the following link: ${url}?token=${token}`,
      },
    );

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}