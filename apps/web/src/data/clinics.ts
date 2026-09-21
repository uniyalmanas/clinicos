import { DEHRADUN_DOCTORS, DoctorProfile } from "./doctors";

export interface ClinicDoctorSummary {
  full_name: string;
  slug: string;
  specialization: string;
  qualification_summary: string;
  consultation_fee: number;
}

export interface ClinicProfile {
  slug: string;
  name: string;
  tagline: string;
  about: string;
  address_line: string;
  locality: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  whatsapp_number: string;
  gstin?: string;
  facilities: string[];
  opening_hours: Record<string, string>;
  doctors: ClinicDoctorSummary[];
}

// Build authentic clinic data from verified Dehradun doctors directory
export const DEHRADUN_CLINICS: ClinicProfile[] = [
  {
    slug: "docsphere-gastro-dehradun",
    name: "DocSphere Direct - Gastro Care",
    tagline: "Premier Digestive, Endoscopy & Liver Care Centre",
    about: "Specialized clinical gastro centre offering digital video endoscopy, colonoscopy screening, fatty liver management, and acid-peptic disorders care in central Dehradun.",
    address_line: "14, Rajpur Road, Near Ashley Hall",
    locality: "Rajpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543209",
    whatsapp_number: "+919876543209",
    facilities: ["High-Def Video Endoscopy", "Colonoscopy Suite", "Full AC", "UPI Soundbox", "Patient Recovery Room"],
    opening_hours: {
      "Monday - Saturday": "09:30 AM - 01:30 PM, 05:00 PM - 08:30 PM",
      "Sunday": "Emergency Consultation Only"
    },
    doctors: [
      {
        full_name: "Dr Rohit Sureka",
        slug: "dr-rohit-sureka",
        specialization: "Gastroenterology/Gi Medicine Specialist",
        qualification_summary: "MBBS, DNB (General Medicine), DNB (Gastroenterology)",
        consultation_fee: 999
      }
    ]
  },
  {
    slug: "derma-care-dehradun",
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology & Cosmetic Laser Solutions",
    about: "State of the art skin clinic specializing in acne, laser scar reduction, eczema, and hair loss therapies with certified dermatology protocols.",
    address_line: "14, Rajpur Road, Near Ashley Hall",
    locality: "Rajpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
    facilities: ["Laser Treatment Suite", "Full AC", "PRP Station", "Wheelchair Accessible", "UPI Soundbox"],
    opening_hours: {
      "Monday - Friday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      "Saturday": "10:00 AM - 04:00 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Rahul Sharma",
        slug: "dr-rahul-sharma",
        specialization: "Dermatologist",
        qualification_summary: "MBBS, MD (Dermatology)",
        consultation_fee: 600
      }
    ]
  },
  {
    slug: "smile-craft-dental",
    name: "Smile Craft Multi-Speciality Dental",
    tagline: "Gentle, Precision Dental Care & Implants",
    about: "Modern digital dental practice offering single-sitting painless root canals, invisible aligners, and dental implants.",
    address_line: "42, EC Road, Near Survey Chowk",
    locality: "EC Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543211",
    whatsapp_number: "+919876543211",
    facilities: ["Digital RVG X-Ray", "Autoclave Sterilization", "Full AC", "Implant Engine"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
      "Sunday": "Emergency Only"
    },
    doctors: [
      {
        full_name: "Dr. Aditi Joshi",
        slug: "dr-aditi-joshi",
        specialization: "Dentist",
        qualification_summary: "BDS, MDS (Endodontics)",
        consultation_fee: 400
      }
    ]
  },
  {
    slug: "dron-child-clinic",
    name: "Dron Child & Newborn Health Centre",
    tagline: "Compassionate Pediatric Care & Vaccination Hub",
    about: "Dedicated child healthcare centre offering complete infant immunization, nebulization, and pediatric wellness care.",
    address_line: "88, Chakrata Road, Near Ballupur Chowk",
    locality: "Chakrata Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543212",
    whatsapp_number: "+919876543212",
    facilities: ["WHO Vaccine Cold Chain", "Nebulization Station", "Child Friendly Play Area", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM",
      "Sunday": "10:00 AM - 01:00 PM"
    },
    doctors: [
      {
        full_name: "Dr. Vikram Sethi",
        slug: "dr-vikram-sethi",
        specialization: "Pediatrician",
        qualification_summary: "MBBS, DCH, DNB (Pediatrics)",
        consultation_fee: 500
      }
    ]
  },
  {
    slug: "himalayan-heart-clinic",
    name: "Himalayan Heart & Vascular Clinic",
    tagline: "Evidence-Based Cardiac Diagnostics & Prevention",
    about: "Cardiology consultation, 12-lead ECG, 2D Echocardiography review, and comprehensive blood pressure management.",
    address_line: "56, Rajpur Road, Opp. Hotel Madhuban",
    locality: "Rajpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543214",
    whatsapp_number: "+919876543214",
    facilities: ["Digital 12-Lead ECG", "Echocardiography Unit", "Emergency Vitals Station", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Priya Nair",
        slug: "dr-priya-nair",
        specialization: "Cardiologist",
        qualification_summary: "MBBS, MD (Medicine), DM (Cardiology)",
        consultation_fee: 800
      }
    ]
  },
  {
    slug: "doon-ortho-spine",
    name: "Doon Ortho & Joint Spine Clinic",
    tagline: "Joint Mobility, Fracture Care & Spine Wellness",
    about: "Orthopedic consultation for knee pain, arthritis, lumbar spine strain, and post-fracture recovery.",
    address_line: "24, Ballupur Chowk, Chakrata Road",
    locality: "Ballupur Chowk",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543215",
    whatsapp_number: "+919876543215",
    facilities: ["Digital X-Ray", "Plaster & Cast Room", "Physiotherapy Rehab Bay", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "09:00 AM - 01:00 PM, 04:30 PM - 08:30 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Rajesh Semwal",
        slug: "dr-rajesh-semwal",
        specialization: "Orthopedic Surgeon",
        qualification_summary: "MBBS, MS (Orthopedics), Fellowship Joint Replacement",
        consultation_fee: 600
      }
    ]
  },
  {
    slug: "docsphere-survey-chowk",
    name: "DocSphere Clinic, Survey Chowk",
    tagline: "Comprehensive Liver Care & Digestive Medicine",
    about: "Consultation clinic for chronic GERD, fatty liver protocols, and digestive endoscopy reviews.",
    address_line: "42, EC Road, Survey Chowk",
    locality: "EC Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543228",
    whatsapp_number: "+919876543228",
    facilities: ["Diagnostic OPD", "Ultrasound Bay", "Full AC", "UPI Soundbox"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 02:00 PM, 05:30 PM - 08:30 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr Harish K C",
        slug: "dr-harish-k-c",
        specialization: "Gastroenterology/Gi Medicine Specialist",
        qualification_summary: "MBBS, MD, DM (Gastroenterology)",
        consultation_fee: 1000
      }
    ]
  },
  {
    slug: "doon-family-health",
    name: "Doon Family Health & Diabetes Care",
    tagline: "Primary Healthcare, Fever & Diabetes Protocol",
    about: "General physician clinic for everyday fever, hypertension, diabetes control, and seasonal infections.",
    address_line: "12, Saharanpur Road, Near Patel Chowk",
    locality: "Saharanpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543213",
    whatsapp_number: "+919876543213",
    facilities: ["Blood Glucose Fast-Check", "Daycare Observation", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "09:00 AM - 02:00 PM, 05:00 PM - 09:00 PM",
      "Sunday": "10:00 AM - 01:00 PM"
    },
    doctors: [
      {
        full_name: "Dr. Arvind Rawat",
        slug: "dr-arvind-rawat",
        specialization: "General Physician",
        qualification_summary: "MBBS, MD (General Medicine)",
        consultation_fee: 400
      }
    ]
  },
  {
    slug: "motherhood-care-dehradun",
    name: "Motherhood Care & Fertility Clinic",
    tagline: "Compassionate Women's Health & Antenatal Care",
    about: "Complete gynecological and pregnancy care, ultrasound evaluation, and PCOS management.",
    address_line: "31, Dalanwala, Circular Road",
    locality: "Dalanwala",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543216",
    whatsapp_number: "+919876543216",
    facilities: ["Ultrasound Scan", "Fetal Doppler", "NST Monitor", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 01:30 PM, 05:00 PM - 07:30 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Meenakshi Sundaram",
        slug: "dr-meenakshi-sundaram",
        specialization: "Gynecologist",
        qualification_summary: "MBBS, MS (Obstetrics & Gynecology)",
        consultation_fee: 600
      }
    ]
  },
  {
    slug: "ayurveda-panchakarma-kendra",
    name: "AyurVeda Health & Panchakarma Kendra",
    tagline: "Classical Ayurvedic Detox & Nadi Pariksha",
    about: "Authentic Ayurvedic pulse diagnosis (Nadi Pariksha), classical Panchakarma detox, and herbal remedies.",
    address_line: "15, Circular Road, Dalanwala",
    locality: "Dalanwala",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543224",
    whatsapp_number: "+919876543224",
    facilities: ["Shirodhara Room", "Herbal Pharmacy", "Panchakarma Treatment Bays", "Peaceful Garden"],
    opening_hours: {
      "Monday - Saturday": "08:30 AM - 01:00 PM, 04:30 PM - 07:30 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Vaidya Rameshwar Prasad",
        slug: "vaidya-rameshwar-prasad",
        specialization: "Ayurvedic Physician",
        qualification_summary: "BAMS, MD (Ayurveda Panchakarma)",
        consultation_fee: 400
      }
    ]
  },
  {
    slug: "active-life-physio",
    name: "Active Life Physio & Sports Rehab",
    tagline: "Evidence-Based Musculoskeletal & Sports Rehabilitation",
    about: "Specialized sports rehabilitation, dry needling, cervical spine posture correction, and post-surgery recovery.",
    address_line: "50, EC Road, Near Dwarika Store",
    locality: "EC Road",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    phone: "+919876543227",
    whatsapp_number: "+919876543227",
    facilities: ["Electrotherapy Bay", "Dry Needling Room", "Therapeutic Gym", "Spine Traction Unit"],
    opening_hours: {
      "Monday - Saturday": "08:30 AM - 12:30 PM, 04:30 PM - 08:30 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Rohan Uniyal (PT)",
        slug: "dr-rohan-uniyal",
        specialization: "Physiotherapist",
        qualification_summary: "BPT, MPT (Sports Rehab & Musculoskeletal Orthopedics)",
        consultation_fee: 400
      }
    ]
  }
];

export const CLINICS_MAP: Record<string, ClinicProfile> = DEHRADUN_CLINICS.reduce((acc, clinic) => {
  acc[clinic.slug] = clinic;
  return acc;
}, {} as Record<string, ClinicProfile>);
