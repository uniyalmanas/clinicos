export const demoClinics = [
  {
    id: "clinic-derma",
    slug: "derma-care-dehradun",
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology & Cosmetic Laser Solutions",
    about: "Skin and laser clinic focused on hair, pigment, and acne care.",
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
    city: "Dehradun",
    state: "Uttarakhand",
    address_line: "14, Rajpur Road, Near Ashley Hall",
    postal_code: "248001",
    facilities: ["Full AC", "Laser Suite", "WiFi", "Wheelchair Accessible"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      Sunday: "Closed"
    },
    status: "active"
  },
  {
    id: "clinic-dental",
    slug: "smile-craft-dental",
    name: "Smile Craft Multi-Speciality Dental",
    tagline: "Gentle dental care and cosmetic dentistry",
    about: "Modern dental care focused on painless treatment and smile design.",
    phone: "+919876543211",
    whatsapp_number: "+919876543211",
    city: "Dehradun",
    state: "Uttarakhand",
    address_line: "42, EC Road, Near Survey Chowk",
    postal_code: "248001",
    facilities: ["Full AC", "Digital X-Ray", "WiFi"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
      Sunday: "Emergency Only"
    },
    status: "active"
  }
];

export const demoDoctors = [
  {
    id: "doctor-rahul",
    slug: "dr-rahul-sharma",
    full_name: "Dr. Rahul Sharma",
    specialization: "Dermatologist",
    qualification_summary: "MBBS, MD (Dermatology)",
    consultation_fee: 600,
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_slug: "derma-care-dehradun",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    rating: 4.9,
    total_reviews: 142,
    opd_timings: "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM"
  },
  {
    id: "doctor-aditi",
    slug: "dr-aditi-joshi",
    full_name: "Dr. Aditi Joshi",
    specialization: "Dentist",
    qualification_summary: "BDS, MDS (Endodontics)",
    consultation_fee: 400,
    clinic_name: "Smile Craft Multi-Speciality Dental",
    clinic_slug: "smile-craft-dental",
    clinic_address: "42, EC Road, Near Survey Chowk, Dehradun",
    rating: 4.8,
    total_reviews: 98,
    opd_timings: "Mon - Sat: 10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM"
  }
];
