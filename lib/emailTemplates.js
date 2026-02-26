export function bookingOnlyEmail({ name, booking }) {
  return `
    <h3>Booking Confirmed</h3>
    <p>Hello ${name},</p>
    <p>Your booking has been created successfully.</p>

    <ul>
      <li>Guest House: ${booking.guestHouseId.name}</li>
      <li>Room: ${booking.roomId.roomNumber}</li>
      <li>Check-in: ${booking.checkInDate}</li>
      <li>Check-out: ${booking.checkOutDate}</li>
    </ul>

    <p>Thank you.</p>
  `;
}

export function credentialsAndBookingEmail({ name, email, password, booking }) {
  return `
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
      <li>Check-in: ${booking.checkInDate}</li>
      <li>Check-out: ${booking.checkOutDate}</li>
    </ul>

    <p>Please change your password after login.</p>
  `;
}
