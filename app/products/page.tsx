'use client';

import React, { useState, useEffect } from 'react';
import { Package, Sparkles, TrendingUp, Layers, RefreshCw } from 'lucide-react';
import { Product } from '@/lib/db/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>AI Catalog Active</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Package className="h-6 w-6 text-brand-400" />
            <span>Agent-Readable Product Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Structured catalog information formatted for autonomous AI agent analysis, cross-sell discovery, and AOV expansion.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Catalog</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => {
          const confidencePct = Math.round((p.cross_sell_confidence || 0.87) * 100);

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="h-44 w-full bg-slate-950 overflow-hidden relative">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-lg bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold font-mono text-emerald-300 border border-emerald-700/80 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      <span>AI Ready</span>
                    </span>
                  </div>

                  <span className="absolute top-3 right-3 rounded-lg bg-slate-950/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold font-mono text-emerald-400 border border-slate-800">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-brand-400 bg-brand-950/80 border border-brand-800 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SKU: {p.sku}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

                  {/* AI Affinity Structured Information */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Frequently Bought With:</span>
                      <span className="font-mono text-indigo-300 font-semibold">{p.related_product_name || 'Nomad Explorer Backpack'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Cross-sell Confidence:</span>
                      <span className="font-mono text-emerald-400 font-bold">{confidencePct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Target Segment:</span>
                      <span className="font-mono text-amber-300 font-semibold">{p.target_segment || 'HIGH_VALUE'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Orders: <span className="text-white font-mono font-bold">{p.order_count}</span>
                </div>
                <div>
                  Total Revenue: <span className="text-emerald-400 font-mono font-bold">₹{p.total_revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
