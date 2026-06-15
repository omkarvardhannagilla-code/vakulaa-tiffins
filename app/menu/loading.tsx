export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white border-b border-brand-mist" />

      {/* Hero skeleton */}
      <div className="bg-brand-forest h-40 animate-pulse" />

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
              <div className="h-44 bg-gray-100 shimmer" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded shimmer w-3/4" />
                <div className="h-3 bg-gray-100 rounded shimmer w-full" />
                <div className="h-3 bg-gray-100 rounded shimmer w-2/3" />
                <div className="flex justify-between mt-3">
                  <div className="h-5 w-12 bg-gray-100 rounded shimmer" />
                  <div className="h-7 w-24 bg-gray-100 rounded-xl shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
