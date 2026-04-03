import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";

const PAYMENT_MODES = [
  { value: "COMPANY_SPONSORED", label: "Company Sponsored" },
  { value: "SALARY_DEDUCTION", label: "Salary Deduction" },
  { value: "SELF_PAY", label: "Self Pay" },
];

export function CustomerBookingForm({
  selectedGuestHouse,
  selectedRoom,
  formData,
  onChange,
  onBack,
  onSubmit,
  submitting,
  checkIn,
  checkOut,
  checkInTime,
  checkOutTime
}) {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Complete Your Booking</h1>
            <p className="text-muted-foreground text-sm">
              Room {selectedRoom?.roomNumber} at {selectedGuestHouse?.name}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="bg-card border rounded-xl p-6 space-y-6">
            {/* Visit Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User size={18} />
                <h2 className="font-semibold">Visit Details</h2>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(value) => onChange("paymentMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Purpose of Visit</Label>
                <Textarea
                  placeholder="Describe the purpose of this booking..."
                  value={formData.purpose}
                  onChange={(e) => onChange("purpose", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Booking Summary */}
              <div className="bg-secondary rounded-lg p-4 mt-6 space-y-3">
                <h3 className="font-medium">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span>{checkIn} {checkInTime}</span>
                  <span className="text-muted-foreground">Check-out:</span>
                  <span>{checkOut} {checkOutTime}</span>
                  <span className="text-muted-foreground">Payment:</span>
                  <span>{PAYMENT_MODES.find((m) => m.value === formData.paymentMode)?.label}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-success hover:bg-success/90"
                disabled={submitting || !formData.purpose || new Date(checkIn) >= new Date(checkOut)}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Submitting…
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}