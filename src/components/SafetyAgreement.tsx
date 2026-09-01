import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const SAFETY_TEXT =
  'NearNaija connects buyers and sellers in your community. We do not handle payments or guarantee any transaction. Always verify before paying and meet in safe public places. NearNaija is not liable for any fraudulent activity on this platform. By continuing you agree to use this platform safely and responsibly.';

export function SafetyAgreement({
  onAccept,
}: {
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <ShieldCheck className="text-brand-primary" size={28} />
          </div>
          <h2 className="text-lg font-bold">Stay Safe on NearNaija</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{SAFETY_TEXT}</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-5 h-5 accent-brand-primary"
          />
          <span className="text-sm font-medium">I have read and agree</span>
        </label>
        <button
          disabled={!checked}
          onClick={onAccept}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          I Agree — Continue
        </button>
      </div>
    </div>
  );
}
