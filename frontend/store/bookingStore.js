import { create } from 'zustand';

const initialState = {
  // Step 1 — Patient Details
  patientDetails: {
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    nationalId: '',
    address: { line1: '', line2: '', city: '', state: '', postalCode: '', country: '' },
  },
  // Step 2 — Medical Info
  medicalInfo: {
    allergies: [],
    conditions: [],
    medications: [],
    pharmacy: '',
    symptoms: '',
    symptomDuration: '',
    urgency: 'Routine',
  },
  // Step 3 — Booking Selection
  bookingSelection: {
    country: null,       // { _id, name, timezone }
    service: null,       // { _id, title, price, currency }
    doctor: null,        // { _id, fullName, specialization }
    preferredMode: 'video',
    date: '',
    time: '',
    referralCode: '',
  },
  // Step 4 — Consent
  consent: {
    gdpr: false,
    treatment: false,
    shareFHIR: false,
    marketing: false,
  },
  // After OTP — user decides guest or register
  otpVerified: false,
  userId: null,

  // After payment
  appointmentId: null,
  paymentIntentId: null,
  currentStep: 1,
};

export const useBookingStore = create((set, get) => ({
  ...initialState,

  setPatientDetails: (data) => set({ patientDetails: { ...get().patientDetails, ...data } }),
  setMedicalInfo: (data) => set({ medicalInfo: { ...get().medicalInfo, ...data } }),
  setBookingSelection: (data) => set({ bookingSelection: { ...get().bookingSelection, ...data } }),
  setConsent: (data) => set({ consent: { ...get().consent, ...data } }),
  setOtpVerified: (userId) => set({ otpVerified: true, userId }),
  setAppointmentId: (id) => set({ appointmentId: id }),
  setPaymentIntentId: (id) => set({ paymentIntentId: id }),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),

  // Build the full appointment payload to send to backend
  buildAppointmentPayload: () => {
    const s = get();
    return {
      patient: {
        ...s.patientDetails,
        address: { ...s.patientDetails.address, country: s.bookingSelection.country?.name },
      },
      medical: {
        allergies: s.medicalInfo.allergies,
        conditions: s.medicalInfo.conditions,
        meds: s.medicalInfo.medications,
        symptoms: s.medicalInfo.symptoms,
        symptomDuration: s.medicalInfo.symptomDuration,
        urgency: s.medicalInfo.urgency,
        pharmacy: s.medicalInfo.pharmacy,
      },
      service: {
        id: s.bookingSelection.service?._id,
        name: s.bookingSelection.service?.title,
        amount: s.bookingSelection.service?.price,
        currency: s.bookingSelection.service?.currency || 'EUR',
      },
      appointment: {
        preferredMode: s.bookingSelection.preferredMode,
        date: s.bookingSelection.date,
        time: s.bookingSelection.time,
        referralCode: s.bookingSelection.referralCode,
        doctorId: s.bookingSelection.doctor?._id,
      },
      consent: s.consent,
    };
  },

  reset: () => set(initialState),
}));
