import React from 'react';
import { Check, Pencil, MessageSquare } from 'lucide-react';
import { PostcodeRecord } from '../data/australianPostcodes';
import { BillingCycle, ContainerSizeId, DeliverySlotWindow, ServiceType, StorageDuration } from '../types/quote';

interface RightSidebarProps {
  currentStep: number;
  onJumpToStep: (step: number) => void;
  originPostcode: PostcodeRecord | null;
  destinationPostcode?: PostcodeRecord | null;
  movingDistanceKm?: number | null;
  movingKmCharge?: number;
  fuelSurchargeAmount?: number;
  serviceType: ServiceType;
  storagePlacement?: 'my_place' | 'facility';
  containerSize: ContainerSizeId;
  containerCount?: number;
  storageDuration: StorageDuration;
  preferredDate: string;
  selectedSlot?: DeliverySlotWindow;
  metroHubName?: string;
  billingCycle?: BillingCycle;
  boxesCount?: number;
  blanketsCount?: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentStep,
  onJumpToStep,
  originPostcode,
  destinationPostcode,
  movingDistanceKm,
  movingKmCharge,
  fuelSurchargeAmount,
  serviceType,
  storagePlacement = 'my_place',
  containerSize,
  containerCount = 1,
  storageDuration,
  preferredDate,
  selectedSlot,
  metroHubName = 'Adelaide',
  billingCycle = 'monthly',
  boxesCount = 0,
  blanketsCount = 0,
}) => {
  const getServiceLabel = () => {
    if (serviceType === 'storage_at_place') return 'Storage, at my place';
    if (serviceType === 'storage_facility') return 'Storage, at Portabox facility';
    if (serviceType === 'moving') {
      if (destinationPostcode) {
        return `Moving to ${destinationPostcode.suburb} ${movingDistanceKm ? `(${movingDistanceKm} km)` : ''}`;
      }
      return 'Moving door to door';
    }
    if (serviceType === 'moving_storage') {
      if (destinationPostcode) {
        return `Move & store: ${originPostcode?.suburb} → ${destinationPostcode.suburb}`;
      }
      return 'Moving and storage';
    }
    return 'Moving and storage';
  };

  const getSizeLabel = () => {
    switch (containerSize) {
      case 'small_10m3':
        return containerCount > 1 ? `${containerCount} x Small (${containerCount * 10} m³)` : '1 x Small (10 m³)';
      case 'medium_19m3':
        return containerCount > 1 ? `${containerCount} x Medium (${containerCount * 19} m³)` : '1 x Medium (19 m³)';
      case 'large_25m3':
        return containerCount > 1 ? `${containerCount} x Large (${containerCount * 25} m³)` : '1 x Large (25 m³)';
      case 'combo_35m3':
        return 'Large + Small combo (35 m³ · 2 units)';
      case 'two_large_50m3':
        return '2 x Large (50 m³ · 2 units)';
      default:
        return '1 x Large (25 m³)';
    }
  };

  const getDurationLabel = () => {
    let dur = storageDuration.replace(/_/g, ' ');
    if (storageDuration === '2_weeks') dur = '2 weeks';
    if (storageDuration === '1_to_3_months') dur = '1 to 3 months';
    if (storageDuration === '4_to_11_months') dur = '4 to 11 months';
    if (storageDuration === '12_plus_months') dur = '12+ months';

    let cycle = 'Monthly billing';
    if (billingCycle === 'weekly') cycle = 'Weekly billing';
    else if (billingCycle === '3_months_upfront') cycle = '3 mo upfront billing';
    else if (billingCycle === '6_months_upfront') cycle = '6 mo upfront billing';
    else if (billingCycle === '12_months_upfront') cycle = '12 mo upfront billing';

    return `${dur} · ${cycle} · from ${preferredDate}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Tracker Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
          {currentStep === 5 ? 'YOUR DETAILS' : 'YOUR QUOTE SO FAR'}
        </h3>

        <div className="space-y-3">
          {/* Step 1: Where */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 1
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 1 && originPostcode ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 1 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    1
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 1 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  Where
                </span>
              </div>
              {currentStep > 1 && originPostcode && (
                <button
                  onClick={() => onJumpToStep(1)}
                  aria-label="Edit location"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 1 && originPostcode && (
              <div className="mt-1.5 ml-7.5 space-y-1">
                {(serviceType === 'moving' || serviceType === 'moving_storage') ? (
                  <>
                    <div className="text-xs text-slate-700 font-medium flex items-baseline gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">From:</span>
                      <span>{originPostcode.suburb}, {originPostcode.state} {originPostcode.postcode}</span>
                    </div>

                    <div className="text-xs font-medium pt-0.5">
                      {destinationPostcode ? (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00c0f3]">Moving to:</span>
                            <span className="font-bold text-[#0b2942]">
                              {destinationPostcode.suburb}, {destinationPostcode.state} {destinationPostcode.postcode}
                            </span>
                          </div>
                          {movingDistanceKm !== undefined && movingDistanceKm !== null && (
                            <div className="text-[11px] text-slate-500 font-medium pl-0.5 space-y-0.5">
                              <div>
                                Distance: <span className="font-mono font-bold text-[#00c0f3]">{movingDistanceKm} km</span> <span className="text-slate-400">(road driving)</span>
                              </div>
                              {movingKmCharge !== undefined && movingKmCharge > 0 && (
                                <div className="text-[#00c0f3] font-bold text-[10px]">
                                  +${movingKmCharge} extra delivery charge {containerCount > 1 ? `(${containerCount} containers)` : ''}
                                </div>
                              )}
                              {fuelSurchargeAmount !== undefined && fuelSurchargeAmount > 0 && (
                                <div className="text-[#00c0f3] font-bold text-[10px]">
                                  +${fuelSurchargeAmount} fuel surcharge ($0.50/km)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">Moving to:</span>
                          <span>Select in Step 2</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    {originPostcode.suburb}, {originPostcode.state} {originPostcode.postcode}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: What do you need */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 2
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 2 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 2 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    2
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 2 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  What do you need
                </span>
              </div>
              {currentStep > 2 && (
                <button
                  onClick={() => onJumpToStep(2)}
                  aria-label="Edit service type"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 2 && (
              <p className="mt-1 ml-7.5 text-xs text-slate-600 font-medium">{getServiceLabel()}</p>
            )}
          </div>

          {/* Step 3: Which size */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 3
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 3 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 3 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 3 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  Which size
                </span>
              </div>
              {currentStep > 3 && (
                <button
                  onClick={() => onJumpToStep(3)}
                  aria-label="Edit container size"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 3 && (
              <p className="mt-1 ml-7.5 text-xs text-slate-600 font-medium">{getSizeLabel()}</p>
            )}
          </div>

          {/* Step 4: How long and when */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 4
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 4 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 4 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    4
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 4 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  How long and when
                </span>
              </div>
              {currentStep > 4 && (
                <button
                  onClick={() => onJumpToStep(4)}
                  aria-label="Edit duration and date"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 4 && (
              <div className="mt-1 ml-7.5 space-y-0.5">
                <p className="text-xs text-slate-600 font-medium">{getDurationLabel()}</p>
                {selectedSlot && (
                  <p className="text-[11px] text-[#0b2942] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c0f3]" />
                    <span>Slot: {selectedSlot.label} ({selectedSlot.timeRange})</span>
                  </p>
                )}
                {(boxesCount > 0 || blanketsCount > 0) && (
                  <p className="text-[11px] text-[#00c0f3] font-bold">
                    Supplies: {[boxesCount > 0 ? `${boxesCount} boxes` : null, blanketsCount > 0 ? `${blanketsCount} blankets` : null].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Send Quote */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 5
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {currentStep > 5 ? (
                <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === 5 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  5
                </div>
              )}
              <span className={`text-sm font-semibold ${currentStep === 5 ? 'text-[#0b2942]' : 'text-slate-600'}`}>
                Send quote
              </span>
            </div>
          </div>

          {/* Step 6: Your quote */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 6
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 6 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                6
              </div>
              <span className={`text-sm font-semibold ${currentStep === 6 ? 'text-[#0b2942]' : 'text-slate-400'}`}>
                Detailed quote
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Are you stuck text box */}
      <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/80 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00c0f3] text-white shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[#0b2942]">Are you stuck?</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">Text us and we will help you.</p>
            <a
              href="sms:0488883234"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#00c0f3] hover:underline"
            >
              <span>Text us now (0488 883 234)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Price match guarantee Banner */}
      <div className="bg-[#0b2942] rounded-2xl p-5 text-white shadow-xs space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-sky-200 font-bold">Price match guarantee</p>
          <p className="text-base font-bold text-white mt-0.5">Seen it cheaper? We'll beat it.</p>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Provide any comparable written quote from another Australian container service and we guarantee a lower rate.
          </p>
        </div>

        {/* Check out our competitors prices container under Price match guarantee */}
        <div className="pt-2 border-t border-slate-700/80">
          <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-sky-300 block">
              Check out our competitors prices
            </span>
            <p className="text-[11px] text-slate-300 leading-normal">
              Industry standard modular storage benchmarks average <strong className="text-white font-mono">$15.20/m³/mo</strong>. Portabox provides full-size container capacity with substantially lower cost per cubic meter.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Competitor Avg</span>
                <span className="font-mono font-bold text-slate-200">$15.20/m³</span>
              </div>
              <div className="bg-sky-950/60 p-2 rounded-lg border border-sky-600/40">
                <span className="text-sky-300 block text-[9px] uppercase font-bold">Portabox</span>
                <span className="font-mono font-bold text-[#00c0f3]">$8.76 – $10.45</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic pt-0.5">
              Benchmarked: September 2026 across Australian hubs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
