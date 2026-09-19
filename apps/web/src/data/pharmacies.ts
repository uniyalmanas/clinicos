export interface LocalPharmacy {
  id: string;
  slug: string;
  name: string;
  pharmacist_name: string;
  license_number: string; // Drug License (Form 20/21)
  phone: string;
  whatsapp: string;
  locality: string;
  address: string;
  distance_km: number;
  open_now: boolean;
  timings: string;
  home_delivery: boolean;
  delivery_time_mins: string;
  rating: number;
  total_reviews: number;
  is_verified_partner: boolean;
  partner_badge: string;
  lat: number;
  lng: number;
}

export const DEHRADUN_PHARMACIES: LocalPharmacy[] = [
  {
    id: "pharma-001",
    slug: "doon-medicos-rajpur",
    name: "Doon Medicos & Surgical",
    pharmacist_name: "Gaurav Aggarwal (R.Ph)",
    license_number: "UK-DDN-20/21-8941",
    phone: "+919876543211",
    whatsapp: "919876543211",
    locality: "Rajpur Road",
    address: "16, Rajpur Road, Opp. Ashley Hall, Dehradun",
    distance_km: 0.4,
    open_now: true,
    timings: "08:00 AM - 11:30 PM (Daily)",
    home_delivery: true,
    delivery_time_mins: "15 - 25 mins",
    rating: 4.9,
    total_reviews: 342,
    is_verified_partner: true,
    partner_badge: "ClinicOS Verified Partner",
    lat: 30.3425,
    lng: 78.0515
  },
  {
    id: "pharma-002",
    slug: "city-chemist-ec-road",
    name: "City Chemist & Healthcare",
    pharmacist_name: "Sunil Verma (B.Pharm)",
    license_number: "UK-DDN-20/21-6102",
    phone: "+919876543212",
    whatsapp: "919876543212",
    locality: "EC Road",
    address: "44, EC Road, Near Survey Chowk, Dehradun",
    distance_km: 0.9,
    open_now: true,
    timings: "08:30 AM - 11:00 PM (Daily)",
    home_delivery: true,
    delivery_time_mins: "20 - 30 mins",
    rating: 4.8,
    total_reviews: 215,
    is_verified_partner: true,
    partner_badge: "ClinicOS Verified Partner",
    lat: 30.3245,
    lng: 78.0489
  },
  {
    id: "pharma-003",
    slug: "ballupur-health-mart",
    name: "Ballupur 24x7 Health Pharmacy",
    pharmacist_name: "Amit Rawat (R.Ph)",
    license_number: "UK-DDN-20/21-7392",
    phone: "+919876543213",
    whatsapp: "919876543213",
    locality: "Ballupur / Chakrata Rd",
    address: "22, Ballupur Chowk, Chakrata Road, Dehradun",
    distance_km: 1.8,
    open_now: true,
    timings: "24 Hours (Emergency Night Counter)",
    home_delivery: true,
    delivery_time_mins: "20 - 35 mins",
    rating: 4.92,
    total_reviews: 480,
    is_verified_partner: true,
    partner_badge: "ClinicOS Verified Partner",
    lat: 30.3392,
    lng: 78.0195
  },
  {
    id: "pharma-004",
    slug: "dalanwala-wellness-meds",
    name: "Dalanwala Wellness Meds",
    pharmacist_name: "Pooja Negi (M.Pharm)",
    license_number: "UK-DDN-20/21-5510",
    phone: "+919876543214",
    whatsapp: "919876543214",
    locality: "Dalanwala",
    address: "52, Circular Road, Dalanwala, Dehradun",
    distance_km: 1.4,
    open_now: true,
    timings: "09:00 AM - 10:30 PM",
    home_delivery: true,
    delivery_time_mins: "15 - 30 mins",
    rating: 4.85,
    total_reviews: 168,
    is_verified_partner: true,
    partner_badge: "ClinicOS Verified Partner",
    lat: 30.3188,
    lng: 78.0585
  },
  {
    id: "pharma-005",
    slug: "patel-nagar-super-chemist",
    name: "Patel Nagar Super Chemist",
    pharmacist_name: "Ramesh Sharma (R.Ph)",
    license_number: "UK-DDN-20/21-4281",
    phone: "+919876543215",
    whatsapp: "919876543215",
    locality: "Patel Nagar / Saharanpur Rd",
    address: "18, Saharanpur Road, Near Lalpul, Patel Nagar, Dehradun",
    distance_km: 2.5,
    open_now: true,
    timings: "08:00 AM - 11:00 PM",
    home_delivery: true,
    delivery_time_mins: "25 - 40 mins",
    rating: 4.78,
    total_reviews: 194,
    is_verified_partner: false,
    partner_badge: "Local Verified Chemist",
    lat: 30.2985,
    lng: 78.0241
  },
  {
    id: "pharma-006",
    slug: "clock-tower-dispensary",
    name: "Clock Tower Central Dispensary",
    pharmacist_name: "Vikas Joshi (B.Pharm)",
    license_number: "UK-DDN-20/21-3990",
    phone: "+919876543216",
    whatsapp: "919876543216",
    locality: "Clock Tower / Paltan Bazar",
    address: "04, Dispensary Road, Near Ghanta Ghar, Dehradun",
    distance_km: 0.8,
    open_now: true,
    timings: "09:00 AM - 10:00 PM",
    home_delivery: false,
    delivery_time_mins: "Counter Pickup Only",
    rating: 4.7,
    total_reviews: 280,
    is_verified_partner: false,
    partner_badge: "Local Chemist",
    lat: 30.3255,
    lng: 78.0436
  }
];
