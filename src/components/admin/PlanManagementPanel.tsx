import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { 
  Plus, 
  Save, 
  Archive, 
  Activity, 
  Cpu, 
  DollarSign, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  ShieldAlert
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Feature {
  key: string;
  label: string;
  type: "boolean" | "number";
  description: string;
}

interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  value: string; // JSON string
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  features: PlanFeature[];
}

export const PlanManagementPanel: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Error/Success
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected Plan for Editing
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editName, setEditName] = useState("");
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number | string>("");
  const [editAnnualPrice, setEditAnnualPrice] = useState<number | string>("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState<number | string>(0);
  const [editFeatures, setEditFeatures] = useState<Record<string, any>>({});

  // New Plan form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newMonthlyPrice, setNewMonthlyPrice] = useState<number | string>("");
  const [newAnnualPrice, setNewAnnualPrice] = useState<number | string>("");
  const [newSortOrder, setNewSortOrder] = useState<number | string>(0);
  const [newFeatures, setNewFeatures] = useState<Record<string, any>>({});

  const fetchPlansAndFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/plans", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load plan mappings.");
      }

      const data = await res.json();
      setPlans(data.plans || []);
      setFeatures(data.features || []);

      // If editing, re-select updated plan
      if (selectedPlan) {
        const updated = data.plans.find((p: Plan) => p.id === selectedPlan.id);
        if (updated) handleSelectPlan(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to query plan list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndFeatures();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsCreating(false);
    setEditName(plan.name);
    setEditMonthlyPrice(plan.monthlyPriceCents / 100);
    setEditAnnualPrice(plan.annualPriceCents ? plan.annualPriceCents / 100 : "");
    setEditIsActive(plan.isActive);
    setEditIsVisible(plan.isVisible);
    setEditSortOrder(plan.sortOrder);

    // Map feature values
    const feats: Record<string, any> = {};
    plan.features.forEach((pf) => {
      try {
        feats[pf.featureKey] = JSON.parse(pf.value);
      } catch {
        feats[pf.featureKey] = pf.value;
      }
    });
    setEditFeatures(feats);
  };

  const handleFeatureChange = (key: string, val: any) => {
    setEditFeatures((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleNewFeatureChange = (key: string, val: any) => {
    setNewFeatures((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Merge edits with defaults
      const mergedFeatures = { ...editFeatures };
      features.forEach((f) => {
        if (mergedFeatures[f.key] === undefined) {
          mergedFeatures[f.key] = f.type === "boolean" ? false : 0;
        }
      });

      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: selectedPlan.id,
          name: editName,
          monthlyPriceCents: Math.round(Number(editMonthlyPrice) * 100),
          annualPriceCents: editAnnualPrice !== "" ? Math.round(Number(editAnnualPrice) * 100) : null,
          isActive: editIsActive,
          isVisible: editIsVisible,
          sortOrder: Number(editSortOrder),
          features: mergedFeatures,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plan.");
      }

      setSuccess(`Plan '${editName}' updated successfully!`);
      await fetchPlansAndFeatures();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug || newMonthlyPrice === "") return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const mergedFeatures = { ...newFeatures };
      features.forEach((f) => {
        if (mergedFeatures[f.key] === undefined) {
          mergedFeatures[f.key] = f.type === "boolean" ? false : 0;
        }
      });

      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          monthlyPriceCents: Math.round(Number(newMonthlyPrice) * 100),
          annualPriceCents: newAnnualPrice !== "" ? Math.round(Number(newAnnualPrice) * 100) : null,
          isActive: true,
          isVisible: true,
          sortOrder: Number(newSortOrder),
          features: mergedFeatures,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create plan.");
      }

      setSuccess(`Plan '${newName}' created successfully!`);
      setNewName("");
      setNewSlug("");
      setNewMonthlyPrice("");
      setNewAnnualPrice("");
      setNewSortOrder(0);
      setNewFeatures({});
      setIsCreating(false);
      await fetchPlansAndFeatures();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 font-mono uppercase tracking-wider">
            DB Plan & Limit Parameters Panel
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Configure custom subscription levels, adjust feature access tokens, and toggle global capabilities.
          </p>
        </div>
        {!isCreating && (
          <Button
            variant="primary"
            onClick={() => {
              setIsCreating(true);
              setSelectedPlan(null);
            }}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create New Plan
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 border-2 border-red-955 bg-red-50 text-xs text-red-755 rounded-xl font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 border-2 border-emerald-955 bg-emerald-50 text-xs text-emerald-755 rounded-xl font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plans List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
            Pricing Plans Catalog
          </span>

          {loading && plans.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-5 h-5 text-violet-600 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => {
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                      isSelected 
                        ? "border-zinc-950 bg-violet-50/20 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" 
                        : "border-zinc-150 hover:border-zinc-950 bg-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-900 font-mono flex items-center gap-1.5">
                        {p.name}
                        {!p.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[7px] bg-red-50 text-red-600 border border-red-150 uppercase tracking-wide">
                            Archived
                          </span>
                        )}
                        {!p.isVisible && p.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[7px] bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase tracking-wide">
                            Hidden
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-450 font-mono">Slug: {p.slug}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono block text-violet-650">
                        ${(p.monthlyPriceCents / 100).toFixed(2)}/mo
                      </span>
                      {p.annualPriceCents && (
                        <span className="text-[9px] font-mono text-zinc-400 block">
                          ${(p.annualPriceCents / 100).toFixed(2)}/yr
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Workspace Form */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-violet-600" /> Create Custom Pricing Plan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-zinc-450 hover:text-zinc-700 font-mono"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-5 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Enterprise Plan"
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Unique Slug</label>
                    <input
                      type="text"
                      required
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="e.g. enterprise"
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Monthly Price ($)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={newMonthlyPrice}
                      onChange={(e) => setNewMonthlyPrice(e.target.value)}
                      placeholder="29.00"
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Annual Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAnnualPrice}
                      onChange={(e) => setNewAnnualPrice(e.target.value)}
                      placeholder="290.00 (Optional)"
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Sort Order</label>
                    <input
                      type="number"
                      value={newSortOrder}
                      onChange={(e) => setNewSortOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Features list checks */}
                <div className="space-y-3 pt-3 border-t border-zinc-150">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Feature Allocation Matrix
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {features.map((f) => {
                      const isBool = f.type === "boolean";
                      const currentVal = newFeatures[f.key] !== undefined ? newFeatures[f.key] : (isBool ? false : 0);
                      return (
                        <div key={f.key} className="p-3 border border-zinc-150 rounded-xl bg-zinc-50/20 flex flex-col justify-between gap-1.5">
                          <div>
                            <span className="font-bold text-zinc-700 block">{f.label}</span>
                            <span className="text-[9px] text-zinc-400 block leading-tight">{f.description}</span>
                          </div>
                          <div className="mt-1">
                            {isBool ? (
                              <input
                                type="checkbox"
                                checked={!!currentVal}
                                onChange={(e) => handleNewFeatureChange(f.key, e.target.checked)}
                                className="w-4 h-4 accent-violet-650"
                              />
                            ) : (
                              <input
                                type="number"
                                value={currentVal}
                                onChange={(e) => handleNewFeatureChange(f.key, parseInt(e.target.value, 10))}
                                className="w-20 px-2 py-1 border-2 border-zinc-955 rounded-lg bg-white"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Creating..." : "Save New Plan"}
                  </Button>
                </div>
              </form>
            </Card>
          ) : selectedPlan ? (
            <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4.5 h-4.5 text-violet-600 animate-pulse" /> Edit Plan: {selectedPlan.name}
                  </h3>
                  <p className="text-[10px] text-zinc-450 font-mono">Plan UUID: {selectedPlan.id}</p>
                </div>
                {selectedPlan.isActive && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to archive this plan? It will no longer be visible for new purchases, but existing subscribers remain active.")) {
                        setEditIsActive(false);
                      }
                    }}
                    className="text-[10px] py-1 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1" /> Archive Plan
                  </Button>
                )}
              </div>

              <form onSubmit={handleSavePlan} className="space-y-5 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Slug (Locked)</label>
                    <input
                      type="text"
                      disabled
                      value={selectedPlan.slug}
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-400 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Monthly Price ($)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={editMonthlyPrice}
                      onChange={(e) => setEditMonthlyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Annual Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAnnualPrice}
                      onChange={(e) => setEditAnnualPrice(e.target.value)}
                      placeholder="e.g. 190.00"
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-550 uppercase">Sort Order</label>
                    <input
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-zinc-50/50 rounded-xl border border-zinc-150">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 accent-violet-650"
                    />
                    <span className="font-bold text-zinc-700">Active (Purchasable)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsVisible}
                      onChange={(e) => setEditIsVisible(e.target.checked)}
                      className="w-4 h-4 accent-violet-650"
                    />
                    <span className="font-bold text-zinc-700">Visible on Pricing grid</span>
                  </label>
                </div>

                {/* Features matrix values mapping */}
                <div className="space-y-3 pt-3 border-t border-zinc-150">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Feature Allocation Matrix
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {features.map((f) => {
                      const isBool = f.type === "boolean";
                      const currentVal = editFeatures[f.key] !== undefined ? editFeatures[f.key] : (isBool ? false : 0);
                      return (
                        <div key={f.key} className="p-3 border border-zinc-150 rounded-xl bg-zinc-50/20 flex flex-col justify-between gap-1.5">
                          <div>
                            <span className="font-bold text-zinc-700 block">{f.label}</span>
                            <span className="text-[9px] text-zinc-400 block leading-tight">{f.description}</span>
                          </div>
                          <div className="mt-1">
                            {isBool ? (
                              <input
                                type="checkbox"
                                checked={!!currentVal}
                                onChange={(e) => handleFeatureChange(f.key, e.target.checked)}
                                className="w-4 h-4 accent-violet-650"
                              />
                            ) : (
                              <input
                                type="number"
                                value={currentVal}
                                onChange={(e) => handleFeatureChange(f.key, parseInt(e.target.value, 10))}
                                className="w-20 px-2 py-1 border-2 border-zinc-955 rounded-lg bg-white"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card variant="flat" className="p-12 text-center text-zinc-400 font-mono text-xs border-dashed flex flex-col items-center justify-center h-[350px] gap-2">
              <ShieldAlert className="w-8 h-8 text-zinc-350" />
              <span>Select a pricing plan from the catalogue directory to configure pricing details and capabilities.</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
