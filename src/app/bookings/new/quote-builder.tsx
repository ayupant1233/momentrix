"use client";

import { useMemo, useState } from "react";

type PackageOption = {
  id: string;
  label: string;
  hours: number;
  basePrice: number;
  deliverables: string[];
};

const BASE_PACKAGES: PackageOption[] = [
  {
    id: "hourly",
    label: "Hourly coverage",
    hours: 2,
    basePrice: 7500,
    deliverables: ["All edited photos", "Light retouching", "Online gallery"],
  },
  {
    id: "half-day",
    label: "Half-day (4 hrs)",
    hours: 4,
    basePrice: 18000,
    deliverables: ["All edited photos", "Highlight reel", "Online gallery"],
  },
  {
    id: "full-day",
    label: "Full-day (8 hrs)",
    hours: 8,
    basePrice: 32000,
    deliverables: ["All edited photos", "Instagram reel", "30s teaser film"],
  },
];

const ADD_ONS = [
  { id: "drone", label: "Aerial drone coverage", price: 6000 },
  { id: "second-shooter", label: "Second photographer", price: 9000 },
  { id: "same-day", label: "Same-day teaser edits", price: 7500 },
  { id: "albums", label: "Premium photo album", price: 5500 },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

export default function QuoteBuilder() {
  const [selectedPackage, setSelectedPackage] = useState<string>("half-day");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(["drone"]);
  const [currency, setCurrency] = useState<string>("INR");
  const [discount, setDiscount] = useState<number>(0);

  const summary = useMemo(() => {
    const primary = BASE_PACKAGES.find((pkg) => pkg.id === selectedPackage) ?? BASE_PACKAGES[0];
    const addOnDetails = ADD_ONS.filter((addOn) => selectedAddOns.includes(addOn.id));
    const addOnTotal = addOnDetails.reduce((sum, addOn) => sum + addOn.price, 0);
    const subtotal = primary.basePrice + addOnTotal;
    const finalTotal = Math.max(subtotal - discount, 0);

    return {
      primary,
      addOns: addOnDetails,
      addOnTotal,
      subtotal,
      finalTotal,
    };
  }, [discount, selectedAddOns, selectedPackage]);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  function toggleAddon(id: string) {
    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <aside className="space-y-6 rounded-4xl border border-white/10 bg-midnight-900/40 p-6">
      <header className="space-y-1">
        <p className="chip w-fit">Quote builder</p>
        <h2 className="text-xl font-semibold text-white">Instant estimate</h2>
        <p className="text-xs text-slate-300">
          Shape a package that fits your project. These numbers help photographers respond faster.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Preferred package</h3>
        <div className="space-y-3">
          {BASE_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackage(pkg.id)}
              className={`w-full rounded-3xl border px-4 py-3 text-left text-sm transition ${
                pkg.id === selectedPackage
                  ? "border-brand-400/60 bg-brand-500/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-brand-300/40 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{pkg.label}</span>
                <span className="text-xs text-slate-400">{pkg.hours} hrs</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{currencySymbol + pkg.basePrice.toLocaleString()}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {pkg.deliverables.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

  <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Add-ons</h3>
        <div className="space-y-2">
          {ADD_ONS.map((addOn) => (
            <label
              key={addOn.id}
              className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <span>{addOn.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{currencySymbol + addOn.price.toLocaleString()}</span>
                <input
                  type="checkbox"
                  checked={selectedAddOns.includes(addOn.id)}
                  onChange={() => toggleAddon(addOn.id)}
                  className="h-4 w-4 accent-brand-400"
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Currency & incentives</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(CURRENCY_SYMBOLS).map(([code]) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={`rounded-full border px-4 py-2 font-semibold transition ${
                currency === code
                  ? "border-brand-400/70 bg-brand-500/15 text-white"
                  : "border-white/15 text-slate-300 hover:border-brand-300/50 hover:text-white"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="font-medium text-white">Discount or credit</span>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(event) => setDiscount(Number(event.target.value))}
            className="input"
            placeholder="Optional courtesy discount"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-3xl border border-brand-400/40 bg-brand-500/10 p-5 text-sm text-white">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-brand-100">
          <span>Summary</span>
          <span>{summary.primary.hours} hrs coverage</span>
        </div>
        <dl className="space-y-1">
          <div className="flex items-center justify-between text-sm text-slate-200">
            <dt>{summary.primary.label}</dt>
            <dd>{currencySymbol + summary.primary.basePrice.toLocaleString()}</dd>
          </div>
          {summary.addOns.map((addOn) => (
            <div key={addOn.id} className="flex items-center justify-between text-xs text-slate-300">
              <dt>{addOn.label}</dt>
              <dd>{currencySymbol + addOn.price.toLocaleString()}</dd>
            </div>
          ))}
          {discount > 0 ? (
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <dt>Discount</dt>
              <dd>−{currencySymbol + discount.toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm font-semibold text-white">
          <span>Estimated total</span>
          <span>{currencySymbol + summary.finalTotal.toLocaleString()}</span>
        </div>
        <p className="text-xs text-brand-100">
          Share this estimate with your photographer. The final quote will be confirmed during the booking.
        </p>
      </section>
    </aside>
  );
}

