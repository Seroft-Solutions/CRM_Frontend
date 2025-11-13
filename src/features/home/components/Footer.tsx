export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-white py-12 px-4 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-7 h-7">
                <path
                  d="M20 40 L20 80 A10 10 0 0 0 30 90 L70 90 A10 10 0 0 0 80 80 L80 40 Z"
                  fill="var(--sidebar-accent)"
                />
                <ellipse cx="50" cy="40" rx="30" ry="5" fill="var(--sidebar-accent)" />
                <path d="M80 50 Q95 50 95 65 Q95 80 80 80" fill="none" stroke="white" strokeWidth="5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">CRM Cup</span>
          </div>
          <div className="text-sm text-white/70 text-center md:text-right">
            &copy; {currentYear} CRM Cup. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
