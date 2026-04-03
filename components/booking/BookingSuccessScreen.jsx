import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";

export function BookingSuccessScreen({
  isCustomer,
  onNewBooking,
  onViewBookings
}) {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {isCustomer ? "Booking Request Submitted" : "Booking Created"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isCustomer
            ? "Your request has been sent for approval. You will receive a confirmation email once approved."
            : "The booking has been confirmed and the guest has been notified."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onNewBooking}
          >
            New Booking
          </Button>
          <Button onClick={onViewBookings}>
            View Bookings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}