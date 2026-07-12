import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  Check, 
  AlertCircle, 
  DollarSign, 
  Percent, 
  Calendar, 
  Smartphone, 
  Sparkles,
  RefreshCw,
  Building,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InsuranceInfo {
  providerName: string;
  policyNumber: string;
  status: 'Accepted' | 'Out of Network' | 'Pending Review' | 'Rejected';
  generalCoverage: number; // e.g., 80
  hygieneCoverage: number; // e.g., 100
  majorCoverage: number; // e.g., 50
  annualLimit: number;
  benefitsUsed: number;
  remainingBenefits: number;
  deductibleTotal: number;
  deductibleMet: number;
  notes: string;
}

// Preset insurance mock databases for simulation
const insurancePresets: Record<string, InsuranceInfo> = {
  'AXA-MAROC-9921': {
    providerName: 'AXA Assurance Maroc',
    policyNumber: 'AXA-MAROC-9921',
    status: 'Accepted',
    generalCoverage: 80,
    hygieneCoverage: 100,
    majorCoverage: 60,
    annualLimit: 15000, // MAD
    benefitsUsed: 4200,
    remainingBenefits: 10800,
    deductibleTotal: 1000,
    deductibleMet: 1000,
    notes: 'Pre-authorization required for procedures over MAD 5,000.'
  },
  'CIGNA-GLOBAL-771': {
    providerName: 'Cigna Global Health',
    policyNumber: 'CIGNA-GLOBAL-771',
    status: 'Accepted',
    generalCoverage: 90,
    hygieneCoverage: 100,
    majorCoverage: 75,
    annualLimit: 3000, // USD
    benefitsUsed: 450,
    remainingBenefits: 2550,
    deductibleTotal: 250,
    deductibleMet: 250,
    notes: 'Direct billing approved across Casablanca & Rabat nodes.'
  },
  'CNSS-AMO-8843': {
    providerName: 'CNSS / AMO Maroc',
    policyNumber: 'CNSS-AMO-8843',
    status: 'Accepted',
    generalCoverage: 70,
    hygieneCoverage: 80,
    majorCoverage: 50,
    annualLimit: 8000, // MAD
    benefitsUsed: 1200,
    remainingBenefits: 6800,
    deductibleTotal: 500,
    deductibleMet: 500,
    notes: 'Strict national tariff apply. High-grade implants covered up to MAD 2,500/unit.'
  },
  'WAFA-ASSUR-3321': {
    providerName: 'Wafa Assurance',
    policyNumber: 'WAFA-ASSUR-3321',
    status: 'Accepted',
    generalCoverage: 85,
    hygieneCoverage: 100,
    majorCoverage: 60,
    annualLimit: 12000,
    benefitsUsed: 2500,
    remainingBenefits: 9500,
    deductibleTotal: 800,
    deductibleMet: 800,
    notes: 'Co-pay waived for preventive procedures and children teeth hygiene.'
  }
};

interface InsuranceVerificationProps {
  patientId: string;
  patientName: string;
}

export function InsuranceVerification({ patientId, patientName }: InsuranceVerificationProps) {
  const [policyNum, setPolicyNum] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<InsuranceInfo | null>(() => {
    // Default mock data to start with for certain patients
    if (patientId === 'pat_mother') {
      return insurancePresets['WAFA-ASSUR-3321'];
    }
    if (patientId === 'pat_1') {
      return insurancePresets['AXA-MAROC-9921'];
    }
    return null;
  });

  const handleVerify = async (e?: React.FormEvent, customNum?: string) => {
    if (e) e.preventDefault();
    const numberToCheck = customNum || policyNum;

    if (!numberToCheck.trim()) {
      toast.error('Please enter a policy or insurance number to check');
      return;
    }

    setIsVerifying(true);
    toast.loading('AI query in progress: pinging carrier network API...', { id: 'insurance-sync' });

    // Simulate carrier clearance, benefits index query and coverage calculations
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Try finding exact prefix or fallback
    const key = Object.keys(insurancePresets).find(
      k => k.toLowerCase().includes(numberToCheck.toLowerCase()) || numberToCheck.toUpperCase().includes(k.split('-')[0])
    );

    setIsVerifying(false);

    if (key) {
      setVerificationResult(insurancePresets[key]);
      toast.success(`Insurance verified successfully with ${insurancePresets[key].providerName}!`, { id: 'insurance-sync' });
    } else {
      // Generate a dynamic one for realistic feedback instead of failing
      const mockResult: InsuranceInfo = {
        providerName: numberToCheck.toUpperCase().startsWith('AXA') ? 'AXA Assurance' : 'Allianz General Insurance',
        policyNumber: numberToCheck.toUpperCase(),
        status: 'Accepted',
        generalCoverage: 80,
        hygieneCoverage: 90,
        majorCoverage: 50,
        annualLimit: 10000,
        benefitsUsed: 1500,
        remainingBenefits: 8500,
        deductibleTotal: 1000,
        deductibleMet: 1000,
        notes: 'Verified automatically via Central AI Insurance gateway.'
      };
      setVerificationResult(mockResult);
      toast.success('New Insurance policy added and synchronized with Central AI!', { id: 'insurance-sync' });
    }
  };

  const loadPreset = (code: string) => {
    setPolicyNum(code);
    handleVerify(undefined, code);
  };

  const resetInsurance = () => {
    setVerificationResult(null);
    setPolicyNum('');
    toast.info('Insurance record cleared.');
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">AI Insurance Verification</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
          <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
          Prior to Arrival Check
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* If not verified or if searching */}
        {!verificationResult ? (
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-500 leading-normal">
              When a patient calls or sends an insurance number on WhatsApp, the AI automatically checks if the carrier is **accepted**, calculates the exact **procedure coverage**, and checks **remaining annual benefits** before they step foot in the clinic.
            </p>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Enter Policy / Insurance ID
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    value={policyNum}
                    onChange={(e) => setPolicyNum(e.target.value)}
                    placeholder="e.g. AXA-MAROC-9921 or CIGNA-GLOBAL-771"
                    className="block w-full rounded-lg border-slate-200 py-2.5 pl-3 pr-10 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !policyNum}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-lg text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer",
                  isVerifying && "opacity-80 cursor-wait"
                )}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Contacting Insurance Core...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify and Fetch Benefits
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets for Demo */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick-test AI OCR Simulators
              </span>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  onClick={() => loadPreset('WAFA-ASSUR-3321')}
                  className="p-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-[10px] font-semibold text-slate-700 rounded-lg text-left transition-colors cursor-pointer"
                >
                  🏢 Wafa Assurance
                  <span className="block font-mono text-[9px] text-slate-400">Mother / Family plan</span>
                </button>
                <button
                  onClick={() => loadPreset('AXA-MAROC-9921')}
                  className="p-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-[10px] font-semibold text-slate-700 rounded-lg text-left transition-colors cursor-pointer"
                >
                  🏢 AXA Maroc
                  <span className="block font-mono text-[9px] text-slate-400">Premium Dental</span>
                </button>
                <button
                  onClick={() => loadPreset('CNSS-AMO-8843')}
                  className="p-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-[10px] font-semibold text-slate-700 rounded-lg text-left transition-colors cursor-pointer"
                >
                  🏢 CNSS / AMO
                  <span className="block font-mono text-[9px] text-slate-400">National Moroccan Plan</span>
                </button>
                <button
                  onClick={() => loadPreset('CIGNA-GLOBAL-771')}
                  className="p-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-[10px] font-semibold text-slate-700 rounded-lg text-left transition-colors cursor-pointer"
                >
                  🏢 Cigna Global
                  <span className="block font-mono text-[9px] text-slate-400">International Policy</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Verification Success Panel */
          <div className="space-y-4 text-left animate-in fade-in duration-300">
            {/* Status Summary */}
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{verificationResult.providerName}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                    ACCEPTED
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500">ID: {verificationResult.policyNumber}</p>
              </div>
            </div>

            {/* Coverage breakdowns */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Co-pay & Coverage Matrix
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block font-bold">HYGIENE</span>
                  <span className="text-sm font-extrabold text-blue-600">{verificationResult.hygieneCoverage}%</span>
                  <span className="text-[9px] text-slate-500 block">Covered</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block font-bold">ROUTINE</span>
                  <span className="text-sm font-extrabold text-blue-600">{verificationResult.generalCoverage}%</span>
                  <span className="text-[9px] text-slate-500 block">Covered</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block font-bold">MAJOR</span>
                  <span className="text-sm font-extrabold text-indigo-600">{verificationResult.majorCoverage}%</span>
                  <span className="text-[9px] text-slate-500 block">Implants/Root</span>
                </div>
              </div>
            </div>

            {/* Benefit Limits Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Remaining Benefits</span>
                <span className="font-mono font-bold text-emerald-600">
                  {verificationResult.policyNumber.includes('GLOBAL') ? '$' : 'MAD '}
                  {verificationResult.remainingBenefits.toLocaleString()} of {verificationResult.annualLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(verificationResult.remainingBenefits / verificationResult.annualLimit) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Used: {verificationResult.policyNumber.includes('GLOBAL') ? '$' : 'MAD '}{verificationResult.benefitsUsed.toLocaleString()}</span>
                <span>Annual Reset: Dec 31, 2026</span>
              </div>
            </div>

            {/* Deductibles */}
            <div className="p-2.5 bg-blue-50/40 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Deductible status:</span>
              <span className="font-bold text-blue-700">Fully Met ({verificationResult.policyNumber.includes('GLOBAL') ? '$' : 'MAD '}{verificationResult.deductibleTotal})</span>
            </div>

            {/* Notes */}
            <div className="text-[11px] text-slate-500 leading-normal bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Note:</strong> {verificationResult.notes}</span>
            </div>

            {/* Action controls */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
                    loading: 'Re-verifying benefits ledger...',
                    success: 'Benefits updated! Zero claim warnings found.',
                    error: 'Error'
                  });
                }}
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-colors cursor-pointer"
              >
                Re-Verify
              </button>
              <button
                onClick={resetInsurance}
                className="px-3 text-center bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
