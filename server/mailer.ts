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
        from: "Tennis Court Booking <postmaster@sandbox6b13761671614a74bc032445f4e3b109.mailgun.org>",
        to: [`${user.name} ${user.surname} <${user.email}>`],
        subject: `Welcome ${user.name}! Please confirm your email`,
        text: `Dear ${user.name} ${user.surname},
          Welcome to Tennis Court Booking!

          Thank you for subscribing to our tennis court booking platform. To complete your registration and start booking courts, please confirm your email address by clicking the link below:

          ${url}?token=${token}

          WHAT'S NEXT?
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          After confirming your email, you'll be able to:
          • Browse available courts and time slots
          • Book courts instantly with secure payment
          • Manage your reservations from your account
          • Access exclusive member benefits and rates

          NEED HELP?
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          If you have any questions or need assistance, don't hesitate to reach out:
          Email: support@tenniscourt.com
          Phone: (555) 123-4567
          Website: www.tenniscourt.com

          This confirmation link will expire in 24 hours. If you didn't create this account, please ignore this email.

          Best regards,
          Tennis Court Management Team`,
                  html: `
            <div class="email-container">
              <div class="header">
                <span class="emoji">🎾</span>
                <h1>Welcome to Tennis Court Booking!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">You're one step away from booking your perfect court</p>
              </div>
              
              <div class="content">
                <div class="welcome-message">
                  <h2 style="margin-top: 0; color: #2e7d32;">🎉 Welcome ${user.name} ${user.surname}!</h2>
                  <p>Thank you for joining our tennis court booking platform. Let's get you started!</p>
                </div>
                
                <p>To complete your registration and start booking courts, please confirm your email address by clicking the button below:</p>
                
                <div class="link-container">
                  <a href="${url}?token=${token}" class="cta-button">
                    ✅ Confirm My Email Address
                  </a>
                </div>
                
                <div class="features-list">
                  <h3>🚀 What's Next?</h3>
                  <p>After confirming your email, you'll be able to:</p>
                  <ul>
                    <li><strong>Browse available courts</strong> and time slots</li>
                    <li><strong>Book courts instantly</strong> with secure payment</li>
                    <li><strong>Manage your reservations</strong> from your account</li>
                    <li><strong>Access exclusive member benefits</strong> and rates</li>
                  </ul>
                </div>
                
                <div class="contact-info">
                  <h3>📞 Need Help?</h3>
                  <p>If you have any questions or need assistance, don't hesitate to reach out:</p>
                  <div class="contact-item">
                    <strong>Email:</strong>&nbsp;&nbsp;support@tenniscourt.com
                  </div>
                  <div class="contact-item">
                    <strong>Phone:</strong>&nbsp;&nbsp;(555) 123-4567
                  </div>
                  <div class="contact-item">
                    <strong>Web:</strong>&nbsp;&nbsp;www.tenniscourt.com
                  </div>
                </div>
                
                <div class="security-note">
                  <strong>⚠️ Security Note:</strong> This confirmation link will expire in 24 hours. If you didn't create this account, please ignore this email.
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Tennis Court Management Team</strong></p>
                <p>Ready to serve up some fun on the court!</p>
              </div>
            </div>`
      },
    );

    console.log('Subscription confirmation email sent:', data);
    return data;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
}

export async function sendBookingConfirmationEmail(booking, user, court) {
  const mailgun = new Mailgun(FormData);

  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_SECRET_KEY || "your-mailgun-api-key-here"
  });

  const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeSlot = `${booking.hour}:00 - ${booking.hour + 1}:00`;

  try {
    const data = await mg.messages.create(
      "sandbox6b13761671614a74bc032445f4e3b109.mailgun.org",
      {
        from: "Tennis Court Booking <postmaster@sandbox6b13761671614a74bc032445f4e3b109.mailgun.org>",
        to: [`${user.name} ${user.surname} <${user.email}>`],
        subject: `Booking Confirmation - ${court ? court.name : 'Court'} on ${bookingDate}`,
        text: `Dear ${user.name} ${user.surname},
          Your court booking has been confirmed!

          Booking Details:
          - Court: ${court ? court.name : `Court ${booking.courtId}`}
          - Date: ${bookingDate}
          - Time: ${timeSlot}
          - Status: ${booking.paid ? 'Paid' : 'Pending Payment'}
          - Booking ID: ${booking.id}

          ${booking.paid ? 'Thank you for your payment. We look forward to seeing you on the court!' : 'Please complete your payment at your earliest convenience.'}

          If you need to make any changes or have questions, please contact us.

          Best regards,
          Tennis Court Management
        `,
        html: `
          <h2>Booking Confirmation</h2>
          <p>Dear ${user.name} ${user.surname},</p>
          <p>Your court booking has been confirmed!</p>
          
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Court:</strong> ${court ? court.name : `Court ${booking.courtId}`}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${timeSlot}</li>
            <li><strong>Status:</strong> ${booking.paid ? 'Paid' : 'Pending Payment'}</li>
            <li><strong>Booking ID:</strong> ${booking.id}</li>
          </ul>
          
          <p>${booking.paid ? 'Thank you for your payment. We look forward to seeing you on the court!' : 'Please complete your payment at your earliest convenience.'}</p>
          
          <p>If you need to make any changes or have questions, please contact us.</p>
          
          <p>Best regards,<br>Tennis Court Management</p>
        `
      },
    );

    console.log('Booking confirmation email sent:', data);
    return data;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}