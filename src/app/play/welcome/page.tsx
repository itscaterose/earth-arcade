export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-block mb-6">
            <div className="text-6xl">✨</div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
            Check your email, darling.
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Mission 1 is waiting in your inbox.<br />
            (Check spam if you don&apos;t see it in the next few minutes.)
          </p>

          <div className="inline-block px-6 py-3 bg-[#7dd3c0]/10 border border-[#7dd3c0]/30 rounded">
            <p className="text-[#7dd3c0] text-sm">
              Reply to begin. The field is listening.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <a 
            href="https://instagram.com/earth.arcade" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-[#7dd3c0] transition-colors text-sm"
          >
            @earth.arcade
          </a>
        </div>
      </div>
    </div>
  );
}
