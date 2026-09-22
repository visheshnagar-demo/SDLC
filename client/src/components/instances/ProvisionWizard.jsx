import React, { useState } from "react";
import {
  Cpu,
  HardDrive,
  Key,
  DollarSign,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function ProvisionWizard({
  providers = [],
  onSubmit,
  currentUser,
  submitting = false,
  error = null,
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "prod-api-worker-01",
    provider_id: providers[0]?.id || "AWS",
    provider_type: "AWS",
    region: "us-east-1",
    zone: "us-east-1a",
    instance_type: "t3.medium",
    image_id: "ami-ubuntu-22.04-lts",
    ssh_key: "cloudpulse-default-key",
    security_group: "sg-web-public-traffic",
    disk_size_gb: 50,
  });

  const [validationError, setValidationError] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  const providerOptions = [
    {
      id: "AWS",
      name: "Amazon Web Services",
      type: "AWS",
      desc: "EC2 Elastic Compute Cloud",
    },
    {
      id: "GCP",
      name: "Google Cloud Platform",
      type: "GCP",
      desc: "Google Compute Engine (GCE)",
    },
    {
      id: "AZURE",
      name: "Microsoft Azure",
      type: "AZURE",
      desc: "Azure Virtual Machines",
    },
  ];

  const machineTypes = [
    {
      type: "t3.small",
      cpu: "1 vCPU",
      ram: "2 GB",
      priceHr: 0.0208,
      priceMo: 15.0,
    },
    {
      type: "t3.medium",
      cpu: "2 vCPU",
      ram: "4 GB",
      priceHr: 0.0416,
      priceMo: 30.0,
      popular: true,
    },
    {
      type: "n2-standard-2",
      cpu: "2 vCPU",
      ram: "8 GB",
      priceHr: 0.097,
      priceMo: 70.0,
    },
    {
      type: "c6i.xlarge",
      cpu: "4 vCPU",
      ram: "8 GB",
      priceHr: 0.17,
      priceMo: 122.4,
    },
    {
      type: "m6i.2xlarge",
      cpu: "8 vCPU",
      ram: "32 GB",
      priceHr: 0.384,
      priceMo: 276.48,
    },
  ];

  const osImages = [
    {
      id: "ami-ubuntu-22.04-lts",
      name: "Ubuntu 22.04 LTS (Jammy)",
      family: "Linux / Debian",
      icon: "🐧",
    },
    {
      id: "ami-debian-12",
      name: "Debian 12 Bookworm",
      family: "Linux / Debian",
      icon: "🌀",
    },
    {
      id: "ami-al2023",
      name: "Amazon Linux 2023",
      family: "Linux / RHEL",
      icon: "📦",
    },
    {
      id: "ami-win-2022",
      name: "Windows Server 2022 Datacenter",
      family: "Windows",
      icon: "🪟",
    },
  ];

  const selectedMachine =
    machineTypes.find((m) => m.type === formData.instance_type) ||
    machineTypes[1];
  const diskCost = (formData.disk_size_gb * 0.08).toFixed(2);
  const totalMonthlyCost = (selectedMachine.priceMo + Number(diskCost)).toFixed(
    2,
  );

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setValidationError("Please enter a valid instance name.");
      return;
    }
    setValidationError("");
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setValidationError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isAdmin) {
      setValidationError(
        "Unauthorized: Only Administrator role can provision cloud resources.",
      );
      return;
    }
    if (!formData.name.trim()) {
      setValidationError("Instance name is required.");
      return;
    }
    onSubmit && onSubmit(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Wizard Form Steps (2 Columns) */}
      <div className="lg:col-span-2 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1e293b]">
          {[
            { num: 1, title: "Provider & Name" },
            { num: 2, title: "Machine Type" },
            { num: 3, title: "OS & Storage" },
            { num: 4, title: "Network & Review" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                  step === s.num
                    ? "bg-[#06b6d4] text-[#0b1326]"
                    : step > s.num
                      ? "bg-[#10b981] text-white"
                      : "bg-[#171f33] text-[#64748b] border border-[#1e293b]"
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span
                className={`text-xs hidden sm:block ${step === s.num ? "text-[#dae2fd] font-semibold" : "text-[#64748b]"}`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Validation or API Error Alerts */}
        {(validationError || error) && (
          <div className="mb-6 bg-[#f43f5e]/15 border border-[#f43f5e]/40 p-3.5 rounded-xl flex items-center gap-3 text-[#f43f5e] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Step 1: Provider & Basic Metadata */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                1. Select Cloud Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {providerOptions.map((prov) => {
                  const isSelected = formData.provider_type === prov.type;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          provider_type: prov.type,
                          provider_id: prov.id,
                        })
                      }
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-[#06b6d4]/10 border-[#06b6d4] shadow-md"
                          : "bg-[#0b1326] border-[#1e293b] hover:border-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#dae2fd] font-mono">
                          {prov.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#06b6d4]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#bcc9cd]">{prov.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                2. Instance Resource Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. web-gateway-prod-01"
                className="w-full bg-[#0b1326] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs font-mono text-[#dae2fd] focus:outline-none focus:border-[#06b6d4]"
              />
              <span className="text-[11px] text-[#64748b] mt-1 block">
                Alphanumeric characters and hyphens only.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                  Target Region
                </label>
                <select
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="w-full bg-[#0b1326] border border-[#1e293b] rounded-xl px-3 py-2 text-xs font-mono text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] cursor-pointer"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="ap-southeast-1">
                    ap-southeast-1 (Singapore)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                  Availability Zone
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) =>
                    setFormData({ ...formData, zone: e.target.value })
                  }
                  className="w-full bg-[#0b1326] border border-[#1e293b] rounded-xl px-3 py-2 text-xs font-mono text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] cursor-pointer"
                >
                  <option value="us-east-1a">us-east-1a (Primary Zone)</option>
                  <option value="us-east-1b">us-east-1b (Failover Zone)</option>
                  <option value="us-east-1c">us-east-1c (Backup Zone)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Machine Sizing */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-[#bcc9cd] block">
              Choose Machine Type & Compute Specs
            </label>
            <div className="space-y-2.5">
              {machineTypes.map((m) => {
                const isSelected = formData.instance_type === m.type;
                return (
                  <div
                    key={m.type}
                    onClick={() =>
                      setFormData({ ...formData, instance_type: m.type })
                    }
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#06b6d4]/10 border-[#06b6d4] shadow-sm"
                        : "bg-[#0b1326] border-[#1e293b] hover:border-[#334155]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isSelected ? "bg-[#06b6d4]/20 text-[#06b6d4]" : "bg-[#171f33] text-[#bcc9cd]"}`}
                      >
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-[#dae2fd]">
                            {m.type}
                          </span>
                          {m.popular && (
                            <span className="bg-[#10b981]/20 text-[#10b981] text-[10px] px-1.5 py-0.2 rounded font-mono font-medium">
                              Optimal Cost/Perf
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#bcc9cd]">
                          {m.cpu} • {m.ram}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-[#06b6d4]">
                        ${m.priceMo.toFixed(2)}/mo
                      </span>
                      <span className="text-[10px] text-[#64748b] block">
                        ${m.priceHr.toFixed(4)}/hr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: OS & Storage */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                Operating System Boot Image
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {osImages.map((os) => {
                  const isSelected = formData.image_id === os.id;
                  return (
                    <div
                      key={os.id}
                      onClick={() =>
                        setFormData({ ...formData, image_id: os.id })
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#06b6d4]/10 border-[#06b6d4]"
                          : "bg-[#0b1326] border-[#1e293b] hover:border-[#334155]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{os.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-[#dae2fd]">
                            {os.name}
                          </p>
                          <p className="text-[10px] text-[#64748b] font-mono">
                            {os.family}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                Root Disk Volume Size (GP3 SSD)
              </label>
              <div className="flex items-center gap-4 bg-[#0b1326] p-4 rounded-xl border border-[#1e293b]">
                <HardDrive className="w-5 h-5 text-[#06b6d4]" />
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={formData.disk_size_gb}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      disk_size_gb: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#06b6d4]"
                />
                <span className="font-mono text-sm font-bold text-[#dae2fd] min-w-[70px]">
                  {formData.disk_size_gb} GB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Network, Keys & Final Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                  SSH Keypair
                </label>
                <div className="flex items-center gap-2 bg-[#0b1326] border border-[#1e293b] rounded-xl px-3 py-2">
                  <Key className="w-4 h-4 text-[#38bdf8]" />
                  <input
                    type="text"
                    value={formData.ssh_key}
                    onChange={(e) =>
                      setFormData({ ...formData, ssh_key: e.target.value })
                    }
                    className="bg-transparent text-xs font-mono text-[#dae2fd] focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#bcc9cd] block mb-2">
                  Security Group / Firewall
                </label>
                <select
                  value={formData.security_group}
                  onChange={(e) =>
                    setFormData({ ...formData, security_group: e.target.value })
                  }
                  className="w-full bg-[#0b1326] border border-[#1e293b] rounded-xl px-3 py-2 text-xs font-mono text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] cursor-pointer"
                >
                  <option value="sg-web-public-traffic">
                    sg-web-public (HTTP 80, HTTPS 443, SSH 22)
                  </option>
                  <option value="sg-internal-backend">
                    sg-internal (Port 8000, VPC only)
                  </option>
                  <option value="sg-database-restricted">
                    sg-db-restricted (Port 5432)
                  </option>
                </select>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="bg-[#0b1326] border border-[#1e293b] rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-semibold text-[#06b6d4] mb-2">
                Configuration Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#64748b]">Instance:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Provider:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.provider_type}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Region:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.region} ({formData.zone})
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Size:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.instance_type}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Image:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.image_id}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Storage:</span>{" "}
                  <span className="font-mono text-[#dae2fd]">
                    {formData.disk_size_gb} GB GP3
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#1e293b]">
          <button
            type="button"
            disabled={step === 1}
            onClick={handlePrev}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
              step === 1
                ? "opacity-30 cursor-not-allowed border-transparent text-[#64748b]"
                : "bg-[#0b1326] border-[#1e293b] text-[#dae2fd] hover:bg-[#1e293b]"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#06b6d4] hover:bg-[#38bdf8] text-[#0b1326] text-xs font-bold rounded-xl transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !isAdmin}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Provisioning VM...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Launch Cloud Instance</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Sticky FinOps Cost Estimator */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 h-fit sticky top-20 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-[#dae2fd]">
          <DollarSign className="w-5 h-5 text-[#10b981]" />
          <h3 className="font-bold text-sm">FinOps Cost Estimator</h3>
        </div>
        <p className="text-[11px] text-[#bcc9cd]">
          Real-time cloud compute & storage expenditure projection based on
          active pricing cards.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1e293b]">
            <span className="text-[#bcc9cd]">
              Compute ({formData.instance_type})
            </span>
            <span className="font-mono text-[#dae2fd]">
              ${selectedMachine.priceMo.toFixed(2)}/mo
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1e293b]">
            <span className="text-[#bcc9cd]">
              EBS Storage ({formData.disk_size_gb}GB)
            </span>
            <span className="font-mono text-[#dae2fd]">${diskCost}/mo</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1e293b]">
            <span className="text-[#bcc9cd]">Networking (Egress ~100GB)</span>
            <span className="font-mono text-[#dae2fd]">$9.00/mo</span>
          </div>
        </div>

        {/* Total Cost Highlight */}
        <div className="bg-[#0b1326] p-4 rounded-xl border border-[#1e293b] text-center mt-4">
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
            Estimated Monthly Run Rate
          </span>
          <div className="text-2xl font-bold font-mono text-[#10b981] mt-1">
            ${(Number(totalMonthlyCost) + 9).toFixed(2)}
          </div>
          <span className="text-[10px] text-[#bcc9cd] font-mono">
            ~${(selectedMachine.priceHr + 0.012).toFixed(4)} / hour
          </span>
        </div>

        <div className="p-3 bg-[#171f33] rounded-xl text-[11px] text-[#bcc9cd] border border-[#3d494c]/40 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#06b6d4] shrink-0 mt-0.5" />
          <span>
            Compliant with AWS FinOps Tagging Policy & GCP Resource quotas.
          </span>
        </div>
      </div>
    </div>
  );
}
