import React, { useState } from "react";
import { PlusCircle, AlertCircle, CheckCircle2, QrCode } from "lucide-react";

export default function CattleRegistrationForm({
  onSubmit,
  existingCattle = [],
}) {
  const [formData, setFormData] = useState({
    tag_number: "",
    rfid_tag: "",
    breed: "Holstein-Friesian",
    gender: "Female",
    date_of_birth: new Date().toISOString().split("T")[0],
    dam_id: "",
    sire_id: "",
    status: "Lactating",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breeds = [
    "Holstein-Friesian",
    "Jersey",
    "Brown Swiss",
    "Guernsey",
    "Ayrshire",
    "Milking Shorthorn",
  ];

  const statuses = [
    "Lactating",
    "In Heat",
    "Inseminated",
    "Confirmed Pregnant",
    "Dry",
    "Heifer",
    "Calf",
    "Quarantined",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.tag_number.trim() || !formData.rfid_tag.trim()) {
      setError("Please provide both Tag Number and RFID Ear Tag ID.");
      return;
    }

    // Client-side check for duplicate RFID tag
    const isDuplicate = existingCattle.some(
      (c) =>
        c.rfid_tag &&
        c.rfid_tag.trim().toLowerCase() ===
          formData.rfid_tag.trim().toLowerCase(),
    );

    if (isDuplicate) {
      setError("RFID tag already assigned to another cow.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          ...formData,
          dam_id: formData.dam_id || null,
          sire_id: formData.sire_id || null,
        });
      }
      setSuccess(`Cow ${formData.tag_number} successfully registered!`);
      setFormData({
        tag_number: "",
        rfid_tag: "",
        breed: "Holstein-Friesian",
        gender: "Female",
        date_of_birth: new Date().toISOString().split("T")[0],
        dam_id: "",
        sire_id: "",
        status: "Lactating",
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to register cow. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      tag_number: `COW-${randomNum}`,
      rfid_tag: `982 0000${randomNum}${Math.floor(1000 + Math.random() * 9000)}`,
      breed: "Holstein-Friesian",
      gender: "Female",
      date_of_birth: "2022-03-15",
      dam_id: "COW-0512",
      sire_id: "BULL-0089",
      status: "Lactating",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#DBE5E0] shadow-sm p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#DBE5E0] mb-5">
        <div>
          <h3 className="text-base font-bold text-[#171F24] flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-[#0D7A52]" />
            <span>Register New Cow & RFID Tag</span>
          </h3>
          <p className="text-xs text-[#6B7A73]">
            Assign unique RFID ear tag identifier and pedigree lineage
          </p>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-xs text-[#0D7A52] hover:underline font-medium bg-[#E7F5EE] px-2.5 py-1 rounded-md"
        >
          Fill Demo Sample
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF0ED] border border-[#D92929]/30 rounded-lg flex items-center space-x-2 text-xs text-[#D92929]"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#E7F5EE] border border-[#149E4D]/30 rounded-lg flex items-center space-x-2 text-xs text-[#149E4D]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Tag Number *
            </label>
            <input
              type="text"
              name="tag_number"
              placeholder="e.g. COW-1042"
              value={formData.tag_number}
              onChange={(e) =>
                setFormData({ ...formData, tag_number: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              RFID Ear Tag ID *
            </label>
            <input
              type="text"
              name="rfid_tag"
              placeholder="e.g. 982 000010428912"
              value={formData.rfid_tag}
              onChange={(e) =>
                setFormData({ ...formData, rfid_tag: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Breed
            </label>
            <select
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              <option value="Female">Female (Cow/Heifer)</option>
              <option value="Male">Male (Bull/Sire)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Dam (Mother Tag / ID)
            </label>
            <input
              type="text"
              placeholder="e.g. COW-0512"
              value={formData.dam_id}
              onChange={(e) =>
                setFormData({ ...formData, dam_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Sire (Father Tag / Code)
            </label>
            <input
              type="text"
              placeholder="e.g. BULL-0089"
              value={formData.sire_id}
              onChange={(e) =>
                setFormData({ ...formData, sire_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#0D7A52] hover:bg-[#095C3E] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {isSubmitting ? "Registering..." : "Save Cattle Profile"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
