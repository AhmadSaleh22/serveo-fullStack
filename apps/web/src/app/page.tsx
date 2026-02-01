'use client';

import Link from 'next/link';
import { useState } from 'react';

// Icons as SVG components for better performance
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// FAQ data
const faqData = [
  {
    question: "How do customers place orders?",
    questionAr: "ازاي العملاء يطلبوا؟",
    answer: "Customers scan your QR code or click your menu link, browse your menu, select items, and click 'Order on WhatsApp'. The order is automatically formatted and sent to your WhatsApp number.",
    answerAr: "العملاء يمسحوا كود الـ QR أو يضغطوا على لينك المينيو، يتصفحوا المينيو، يختاروا الأصناف، ويضغطوا 'اطلب على واتساب'. الطلب بيتبعت أوتوماتيك على رقم الواتساب بتاعك."
  },
  {
    question: "Do I need to install any app?",
    questionAr: "محتاج أنزل أي تطبيق؟",
    answer: "No! Serveo is completely web-based. You manage everything from your browser - no app installation required for you or your customers.",
    answerAr: "لأ! سيرفيو شغال على المتصفح بالكامل. تقدر تدير كل حاجة من المتصفح - مفيش أي تطبيقات لازم تنزلها لا انت ولا العملاء."
  },
  {
    question: "How do I receive payments?",
    questionAr: "ازاي استلم الفلوس؟",
    answer: "Serveo doesn't process payments - you handle payments directly with your customers (cash on delivery, Instapay, Vodafone Cash, etc). This means zero transaction fees!",
    answerAr: "سيرفيو مش بيتعامل مع الدفع - انت بتتعامل مع العملاء مباشرة (كاش عند الاستلام، انستاباي، فودافون كاش، إلخ). ده معناه صفر عمولات على المعاملات!"
  },
  {
    question: "Can I use my own domain?",
    questionAr: "أقدر أستخدم دومين خاص؟",
    answer: "Yes! Pro and Business plans include custom domain support. Your menu can be at menu.yourrestaurant.com instead of serveo.menu/yourname.",
    answerAr: "أيوه! باقات Pro و Business فيها دعم للدومين الخاص. مينيو مطعمك ممكن يكون على menu.yourrestaurant.com بدل serveo.menu/yourname."
  },
  {
    question: "Is there Arabic support?",
    questionAr: "فيه دعم للعربي؟",
    answer: "Absolutely! Serveo is built Arabic-first with full RTL (right-to-left) support. Your menu looks native to Arabic-speaking customers.",
    answerAr: "طبعاً! سيرفيو مصمم للعربي أولاً مع دعم كامل لـ RTL. المينيو بتاعك هيظهر طبيعي للعملاء اللي بيتكلموا عربي."
  },
  {
    question: "What if I need help setting up?",
    questionAr: "لو احتجت مساعدة في الإعداد؟",
    answer: "We offer free setup assistance via WhatsApp. Our team can help you upload your menu, create QR codes, and get started in under 30 minutes.",
    answerAr: "بنقدم مساعدة مجانية في الإعداد عبر الواتساب. فريقنا يقدر يساعدك ترفع المينيو، تعمل أكواد QR، وتبدأ في أقل من 30 دقيقة."
  }
];

// Testimonial data
const testimonials = [
  {
    quote: "بقى عندي طلبات أكتر بكتير من لما كنت على تطبيقات التوصيل، ومش بدفع 30% عمولة!",
    name: "أحمد محمد",
    restaurant: "مطعم الشام",
    area: "المهندسين",
    rating: 5
  },
  {
    quote: "الإعداد كان سهل جداً. في أقل من ساعة كان المينيو شغال والطلبات بتيجي على الواتساب.",
    name: "سارة حسن",
    restaurant: "كافيه لاتيه",
    area: "مدينة نصر",
    rating: 5
  },
  {
    quote: "العملاء بيحبوا إنهم يطلبوا مباشرة من المينيو. التجربة أسهل وأسرع من التطبيقات التانية.",
    name: "محمد علي",
    restaurant: "شاورما بلس",
    area: "الدقي",
    rating: 5
  }
];

// Feature data
const features = [
  {
    icon: "whatsapp",
    title: "WhatsApp Orders",
    titleAr: "طلبات واتساب",
    description: "Orders come directly to your WhatsApp. Reply, confirm, done.",
    descriptionAr: "الطلبات بتيجي على الواتساب مباشرة. رد، أكد، خلاص."
  },
  {
    icon: "menu",
    title: "Beautiful Online Menu",
    titleAr: "مينيو أونلاين جميل",
    description: "Professional menu page that works on any device. Add photos, descriptions, prices.",
    descriptionAr: "صفحة مينيو احترافية تشتغل على أي جهاز. ضيف صور ووصف وأسعار."
  },
  {
    icon: "arabic",
    title: "Arabic First",
    titleAr: "العربي أولاً",
    description: "Full Arabic support with RTL design. Your customers feel at home.",
    descriptionAr: "دعم كامل للعربي مع تصميم RTL. عملاءك هيحسوا براحة."
  },
  {
    icon: "money",
    title: "Zero Commission",
    titleAr: "صفر عمولة",
    description: "No percentage cuts. Pay a simple flat fee or use free tier forever.",
    descriptionAr: "مفيش نسب مقتطعة. ادفع اشتراك ثابت أو استخدم الباقة المجانية للأبد."
  },
  {
    icon: "chart",
    title: "Order Dashboard",
    titleAr: "لوحة تحكم الطلبات",
    description: "Track all orders, see popular items, understand your customers.",
    descriptionAr: "تابع كل الطلبات، شوف الأصناف المشهورة، افهم عملاءك."
  },
  {
    icon: "link",
    title: "Easy Sharing",
    titleAr: "مشاركة سهلة",
    description: "One link for Instagram bio, Facebook, printed QR codes.",
    descriptionAr: "لينك واحد للإنستجرام، فيسبوك، وأكواد QR مطبوعة."
  }
];

// Pricing data
const pricingPlans = [
  {
    name: "Free",
    nameAr: "مجاني",
    price: "0",
    currency: "EGP",
    period: "/month",
    periodAr: "/شهر",
    description: "Perfect to get started",
    descriptionAr: "مثالي للبداية",
    features: [
      "Up to 20 menu items",
      "WhatsApp orders",
      "Basic menu page",
      "QR code generator",
      "Serveo branding"
    ],
    featuresAr: [
      "حتى 20 صنف في المينيو",
      "طلبات واتساب",
      "صفحة مينيو أساسية",
      "منشئ أكواد QR",
      "شعار سيرفيو"
    ],
    cta: "Start Free",
    ctaAr: "ابدأ مجاناً",
    popular: false
  },
  {
    name: "Pro",
    nameAr: "برو",
    price: "199",
    currency: "EGP",
    period: "/month",
    periodAr: "/شهر",
    description: "For growing restaurants",
    descriptionAr: "للمطاعم النامية",
    features: [
      "Unlimited menu items",
      "Custom domain",
      "Remove Serveo branding",
      "Order analytics",
      "Multi-language menu",
      "Priority support"
    ],
    featuresAr: [
      "أصناف غير محدودة",
      "دومين خاص",
      "إزالة شعار سيرفيو",
      "تحليلات الطلبات",
      "مينيو متعدد اللغات",
      "دعم أولوية"
    ],
    cta: "Start 14-day trial",
    ctaAr: "ابدأ تجربة 14 يوم",
    popular: true
  },
  {
    name: "Business",
    nameAr: "بيزنس",
    price: "499",
    currency: "EGP",
    period: "/month",
    periodAr: "/شهر",
    description: "For chains & enterprises",
    descriptionAr: "للسلاسل والمؤسسات",
    features: [
      "Everything in Pro",
      "Multiple branches",
      "Staff accounts",
      "Advanced analytics",
      "API access",
      "Dedicated support"
    ],
    featuresAr: [
      "كل مميزات برو",
      "فروع متعددة",
      "حسابات للموظفين",
      "تحليلات متقدمة",
      "وصول API",
      "دعم مخصص"
    ],
    cta: "Contact Sales",
    ctaAr: "تواصل مع المبيعات",
    popular: false
  }
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-navy-800">Serveo</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="nav-link">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="nav-link">
                How It Works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="nav-link">
                Pricing
              </button>
              <button onClick={() => scrollToSection('faq')} className="nav-link">
                FAQ
              </button>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn btn-whatsapp gap-2">
                <span>ابدأ مجاناً</span>
                <span className="text-white/80">|</span>
                <span>Start Free</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="container-custom flex flex-col gap-4">
              <button onClick={() => scrollToSection('features')} className="nav-link text-left py-2">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="nav-link text-left py-2">
                How It Works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="nav-link text-left py-2">
                Pricing
              </button>
              <button onClick={() => scrollToSection('faq')} className="nav-link text-left py-2">
                FAQ
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                <Link href="/login" className="btn btn-outline w-full">
                  Login
                </Link>
                <Link href="/register" className="btn btn-whatsapp w-full">
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-800 mb-6 leading-tight">
                Get Restaurant Orders on{' '}
                <span className="gradient-text">WhatsApp</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Create a beautiful online menu, share a link, receive orders directly on WhatsApp.
                No commissions. No apps to install.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link href="/register" className="btn btn-whatsapp btn-lg gap-2 shadow-lg">
                  <span>Start Free - No Credit Card</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link href="/r/demo-restaurant" className="btn btn-outline btn-lg">
                  See Live Demo
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="trust-badge">
                  <CheckIcon className="w-4 h-4 text-primary-600" />
                  <span>Free forever plan</span>
                </div>
                <div className="trust-badge">
                  <CheckIcon className="w-4 h-4 text-primary-600" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="trust-badge">
                  <CheckIcon className="w-4 h-4 text-primary-600" />
                  <span>500+ restaurants</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="phone-mockup w-72 md:w-80 animate-float">
                <div className="phone-screen aspect-[9/19] flex flex-col">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🍔</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Burger House</div>
                      <div className="text-xs text-white/70">online</div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 bg-[#ECE5DD] p-3 space-y-2 overflow-hidden">
                    <div className="whatsapp-bubble text-sm">
                      <div className="font-semibold text-[#075E54] mb-1">🛒 New Order!</div>
                      <div className="text-gray-700 text-xs space-y-1">
                        <div>2x Classic Burger - 180 EGP</div>
                        <div>1x Cheese Fries - 45 EGP</div>
                        <div>2x Pepsi - 30 EGP</div>
                        <div className="border-t border-gray-300 pt-1 mt-2 font-semibold">
                          Total: 255 EGP
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 text-right mt-1">2:34 PM ✓✓</div>
                    </div>

                    <div className="whatsapp-bubble whatsapp-bubble-received text-sm ml-auto">
                      <div className="text-gray-700 text-xs">Order confirmed! Ready in 20 mins 👍</div>
                      <div className="text-[10px] text-gray-500 text-right mt-1">2:35 PM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -left-4 top-1/4 card p-3 shadow-lg animate-bounce-subtle hidden lg:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">📈</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-gray-900">+45%</div>
                    <div className="text-gray-500">More Orders</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 card p-3 shadow-lg animate-bounce-subtle hidden lg:block" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm">💰</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-gray-900">0%</div>
                    <div className="text-gray-500">Commission</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <p className="text-gray-600 font-medium">Trusted by 500+ restaurants across Egypt</p>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
              ))}
              <span className="text-gray-600 ml-2">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Stop paying 30% to delivery apps</h2>
            <p className="section-subtitle">
              Keep more of your revenue with direct WhatsApp orders
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Old Way */}
            <div className="comparison-bad">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XIcon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-800">The Old Way</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">25-30% commission on every order</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No access to customer data</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dependent on their platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Competing with other restaurants</span>
                </li>
              </ul>
            </div>

            {/* Serveo Way */}
            <div className="comparison-good">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-800">The Serveo Way</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Zero commission, flat monthly fee</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Direct WhatsApp contact with customers</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">You own your customer relationships</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Your menu, your brand, your rules</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section bg-gray-50">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Go online in 3 simple steps</h2>
            <p className="section-subtitle">
              No technical skills required. Get your menu online in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="step-number mx-auto mb-4">1</div>
              <div className="card p-6 h-full">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Add Your Menu</h3>
                <p className="text-gray-600">
                  Upload your items with photos, descriptions, and prices. Organize by categories.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="step-number mx-auto mb-4">2</div>
              <div className="card p-6 h-full">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Share Your Link</h3>
                <p className="text-gray-600">
                  Get your custom serveo.menu/yourname link and QR codes for tables.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="step-number mx-auto mb-4">3</div>
              <div className="card p-6 h-full">
                <div className="w-16 h-16 bg-whatsapp/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <WhatsAppIcon className="w-8 h-8 text-whatsapp" />
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Receive Orders</h3>
                <p className="text-gray-600">
                  Customers order from the menu, you receive formatted orders on WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/register" className="btn btn-whatsapp btn-lg gap-2">
              Start Now - It&apos;s Free
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="section bg-white">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Everything you need to succeed</h2>
            <p className="section-subtitle">
              Powerful features designed for restaurants in Egypt
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon ${
                  feature.icon === 'whatsapp' ? 'bg-whatsapp/10 text-whatsapp' :
                  feature.icon === 'money' ? 'bg-green-100 text-green-600' :
                  feature.icon === 'arabic' ? 'bg-orange-100 text-accent-orange' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  {feature.icon === 'whatsapp' && <WhatsAppIcon className="w-7 h-7" />}
                  {feature.icon === 'menu' && <span className="text-2xl">🍽️</span>}
                  {feature.icon === 'arabic' && <span className="text-2xl">🇪🇬</span>}
                  {feature.icon === 'money' && <span className="text-2xl">💰</span>}
                  {feature.icon === 'chart' && <span className="text-2xl">📊</span>}
                  {feature.icon === 'link' && <span className="text-2xl">🔗</span>}
                </div>
                <h3 className="text-lg font-bold text-navy-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section bg-gray-50">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Simple, honest pricing</h2>
            <p className="section-subtitle">
              No hidden fees. No surprises. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="pricing-badge">Most Popular</div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-navy-800 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-navy-800">{plan.price}</span>
                    <span className="text-gray-500 mb-1">{plan.currency}{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Business' ? '/contact' : '/register'}
                  className={`btn w-full ${
                    plan.popular ? 'btn-whatsapp' : 'btn-outline'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8">
            All prices in Egyptian Pounds. No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Loved by restaurant owners</h2>
            <p className="section-subtitle">
              See what our customers are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className="testimonial-quote font-arabic text-right" dir="rtl">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-right flex-1" dir="rtl">
                    <div className="font-semibold text-navy-800 font-arabic">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 font-arabic">
                      {testimonial.restaurant}، {testimonial.area}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section bg-gray-50">
        <div className="container-custom">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Everything you need to know about Serveo
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card divide-y divide-gray-100">
              {faqData.map((faq, index) => (
                <div key={index} className="accordion-item">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="accordion-trigger px-6"
                  >
                    <span>{faq.question}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="accordion-content px-6">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 cta-gradient">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to grow your restaurant?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join 500+ restaurants already using Serveo to receive orders on WhatsApp
          </p>
          <Link
            href="/register"
            className="btn bg-white text-primary-700 hover:bg-gray-100 btn-lg gap-2 shadow-xl"
          >
            <span className="font-arabic">ابدأ مجاناً الآن</span>
            <span className="text-gray-400">|</span>
            <span>Start Free Now</span>
          </Link>
          <p className="text-white/60 mt-4 text-sm">
            No credit card required • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-400 py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold text-white">Serveo</span>
              </Link>
              <p className="text-sm mb-4">
                Your restaurant, online in minutes.
                <br />
                <span className="font-arabic">مطعمك أونلاين في دقائق</span>
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-whatsapp transition-colors">
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><Link href="/r/demo-restaurant" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 Serveo. Made with ❤️ in Egypt
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm">🇪🇬 Egypt</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/201234567890?text=Hi%2C%20I%20have%20a%20question%20about%20Serveo"
        target="_blank"
        rel="noopener noreferrer"
        className="float-whatsapp"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon className="w-6 h-6" />
      </a>

      {/* Mobile Sticky CTA */}
      <div className="mobile-sticky-cta">
        <Link href="/register" className="btn btn-whatsapp w-full gap-2">
          <span>ابدأ مجاناً</span>
          <span className="text-white/60">|</span>
          <span>Start Free</span>
        </Link>
      </div>
    </div>
  );
}
