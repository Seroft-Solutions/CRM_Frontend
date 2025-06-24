export default function Footer() {
  // Get the current year on the server
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card py-12 px-4 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path
                  d="M20 40 L20 80 A10 10 0 0 0 30 90 L70 90 A10 10 0 0 0 80 80 L80 40 Z"
                  className="fill-primary"
                />
                <ellipse cx="50" cy="40" rx="30" ry="5" className="fill-primary" />
                <path
                  d="M80 50 Q95 50 95 65 Q95 80 80 80"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="5"
                />
              </svg>
            </div>
            <span className="text-xl font-bold">CRM Cup</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {currentYear} CRM Cup. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
