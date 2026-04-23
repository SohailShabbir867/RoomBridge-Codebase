import React, { useState } from "react";
import Modal from "../common/Modal";
import { RiLoader4Line, RiFlagLine } from "react-icons/ri";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "fake", label: "Fake / Misleading" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "scam", label: "Scam / Fraud" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

const ReportModal = ({
  isOpen,
  onClose,
  onSubmit,
  targetLabel,
  targetType = "listing",
  loading = false,
}) => {
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ reason, description, targetType });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Report"
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="report-form"
            className="btn-primary flex-1 justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <RiLoader4Line className="animate-spin" />
            ) : (
              <RiFlagLine />
            )}
            Send Report
          </button>
        </div>
      }
    >
      <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary">
          You are reporting:{" "}
          <span className="text-primary font-semibold">{targetLabel}</span>
        </p>

        <div>
          <label className="label">Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
          >
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please share details to help our admin team review this report..."
            minLength={20}
            maxLength={500}
            className="input resize-none"
            required
          />
          <p className="text-xs text-text-secondary text-right mt-1">
            {description.length}/500
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Minimum 20 characters required.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
