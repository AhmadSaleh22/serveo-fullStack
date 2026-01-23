import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-gray-900">MenuOrder</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="btn btn-outline"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="btn btn-primary"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Restaurant Orders
            <br />
            <span className="text-primary-600">via WhatsApp</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Create your online menu, receive orders directly on WhatsApp.
            Simple, fast, and free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn btn-primary btn-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/r/shawarma-palace"
              className="btn btn-outline btn-lg"
            >
              View Demo Menu
            </Link>
          </div>

          {/* Features */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp Orders</h3>
              <p className="text-gray-600">
                Receive orders directly on WhatsApp. No app installation needed for customers.
              </p>
            </div>
            <div className="card p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Arabic & English</h3>
              <p className="text-gray-600">
                Full RTL support for Arabic. Reach more customers in Egypt.
              </p>
            </div>
            <div className="card p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Setup</h3>
              <p className="text-gray-600">
                Create your menu in minutes. Share the link and start receiving orders.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; 2024 MenuOrder. Made for restaurants in Egypt.</p>
        </footer>
      </div>
    </div>
  );
}
