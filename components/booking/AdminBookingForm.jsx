import { useState } from "react";
import { ArrowLeft, User, Building2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const OCCUPANCY_TYPES = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "TRIPLE", label: "Triple" },
];

export function AdminBookingForm({
  step,
  setStep,
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
  checkOutTime,
  setShowDateSelection
}) {
  const [dateSection] = useState(() => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} />
        <h2 className="font-semibold">Booking Details</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Guest House</p>
          <p className="font-medium">{selectedGuestHouse?.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Room</p>
          <p className="font-medium">Room {selectedRoom?.roomNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Check-in</p>
          <p className="font-medium">{checkIn} {checkInTime}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Check-out</p>
          <p className="font-medium">{checkOut} {checkOutTime}</p>
        </div>
      </div>
    </div>
  ));

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setShowDateSelection(true);
      onBack();
      setStep(1);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">New Booking</h1>
            <p className="text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {/* STEP 1: Guest Details */}
          {step === 1 && (
            <div className="bg-card border rounded-xl p-6 space-y-8">
              {dateSection}
              <hr className="border-border" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <h2 className="font-semibold">Guest Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Full Name *</Label>
                    <Input
                      id="guestName"
                      value={formData.guestName}
                      onChange={(e) => onChange("guestName", e.target.value)}
                      placeholder="Enter guest's full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email *</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => onChange("guestEmail", e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => onChange("department", e.target.value)}
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Occupancy Type</Label>
                    <Select
                      value={formData.occupancyType}
                      onValueChange={(value) => onChange("occupancyType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCUPANCY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>
                    Next: Payment & Purpose
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Payment & Purpose */}
          {step === 2 && (
            <div className="bg-card border rounded-xl p-6 space-y-8">
              {dateSection}
              <hr className="border-border" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check size={18} />
                  <h2 className="font-semibold">Payment & Purpose</h2>
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
                  <Label>Purpose of Visit *</Label>
                  <Textarea
                    placeholder="Describe the purpose of this booking..."
                    value={formData.purpose}
                    onChange={(e) => onChange("purpose", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1">
                    Next: Review
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="bg-card border rounded-xl p-6 space-y-8">
              {dateSection}
              <hr className="border-border" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check size={18} />
                  <h2 className="font-semibold">Review & Confirm</h2>
                </div>

                <div className="bg-secondary rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Guest Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.guestName}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{formData.guestEmail}</span>
                    <span className="text-muted-foreground">Department:</span>
                    <span>{formData.department || "Not specified"}</span>
                    <span className="text-muted-foreground">Occupancy:</span>
                    <span>{OCCUPANCY_TYPES.find((t) => t.value === formData.occupancyType)?.label}</span>
                  </div>
                </div>

                <div className="bg-secondary rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span>{checkIn} {checkInTime}</span>
                    <span className="text-muted-foreground">Check-out:</span>
                    <span>{checkOut} {checkOutTime}</span>
                    <span className="text-muted-foreground">Payment:</span>
                    <span>{PAYMENT_MODES.find((m) => m.value === formData.paymentMode)?.label}</span>
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="col-span-1">{formData.purpose}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !formData.purpose}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin mr-2" />Creating Booking…</>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}