const LOGO_URL = `${process.env.APP_URL}/logo.png`;

function formatIST(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const emailWrapper = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="${LOGO_URL}" alt="Lalbaba Guest House" style="height: 60px;" />
    </div>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <div style="padding: 24px 0;">
      ${content}
    </div>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <p style="font-size: 12px; color: #888; text-align: center;">Lalbaba Guest House Management System</p>
  </div>
`;

export function bookingOnlyEmail({ name, booking }) {
  return emailWrapper(`
    <h3>Booking Confirmed</h3>
    <p>Hello ${name},</p>
    <p>Your booking has been created successfully.</p>

    <ul>
      <li>Guest House: ${booking.guestHouseId.name}</li>
      <li>Room: ${booking.roomId.roomNumber}</li>
      <li>Check-in: ${formatIST(booking.checkInDate)}</li>
      <li>Check-out: ${formatIST(booking.checkOutDate)}</li>
    </ul>

    <p>Thank you.</p>
  `);
}

export function credentialsAndBookingEmail({ name, email, password, booking }) {
  return emailWrapper(`
    <h3>Guest House Booking & Login Details</h3>

    <p>Hello ${name},</p>

    <p>An account has been created for you.</p>

    <p><strong>Login Credentials</strong></p>
    <ul>
      <li>Email: ${email}</li>
      <li>Password: ${password}</li>
    </ul>

    <hr/>

    <p><strong>Booking Details</strong></p>
    <ul>
      <li>Guest House: ${booking.guestHouseId.name}</li>
      <li>Room: ${booking.roomId.roomNumber}</li>
      <li>Check-in: ${formatIST(booking.checkInDate)}</li>
      <li>Check-out: ${formatIST(booking.checkOutDate)}</li>
    </ul>

    <p>Please change your password after login.</p>
  `);
}
