import React, { useEffect, useState } from "react";
import communityService from "../../services/communityService";
import CreateCommunityModal from "../../components/community/CreateCommunityModal";
import toast from "react-hot-toast";
import {
  RiLoader4Line,
  RiAddLine,
  RiDeleteBinLine,
  RiLockLine,
  RiGroupLine,
} from "react-icons/ri";

const DK = "#012D1D";
const ACC = "#FFAB69";

/*
  ManageCommunities — admin dashboard page (/admin/communities).
  Lists every community with delete action, and opens CreateCommunityModal
  for new ones. Only reachable via ProtectedRoute role="admin" in
  AppRoutes.jsx — the backend also re-enforces authorize("admin") on every
  mutating route regardless of what the frontend allows.
*/
const ManageCommunities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    document.title = "Manage Communities — RoomBridge Admin";
  }, []);

  const loadCommunities = () => {
    setLoading(true);
    communityService
      .getCommunities()
      .then((res) => setCommunities(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load communities."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this community and all its messages? This cannot be undone.")) {
      return;
    }
    try {
      setDeletingId(id);
      await communityService.deleteCommunity(id);
      setCommunities((cs) => cs.filter((c) => c._id !== id));
      toast.success("Community deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete community.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: DK }}>
            Manage Communities
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create city groups or announcement channels for RoomBridge users.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: DK }}
        >
          <RiAddLine className="text-base" />
          New Community
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-bold text-sm" style={{ color: DK }}>
            No communities yet
          </p>
          <p className="text-xs text-gray-400 mt-1">Create the first one to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: "#E8E2D9" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400" style={{ borderColor: "#E8E2D9" }}>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {communities.map((c) => (
                <tr key={c._id} className="border-b last:border-0" style={{ borderColor: "#F0EBE3" }}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {c.image?.url ? (
                      <img src={c.image.url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: ACC }}
                      >
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium" style={{ color: DK }}>
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{c.type}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || "—"}</td>
                  <td className="px-4 py-3">
                    {c.visibility === "private" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <RiLockLine /> Private
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600">Public</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <RiGroupLine /> {c.memberCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c._id)}
                      disabled={deletingId === c._id}
                      aria-label="Delete community"
                      className="text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === c._id ? (
                        <RiLoader4Line className="animate-spin" />
                      ) : (
                        <RiDeleteBinLine />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={(community) => setCommunities((cs) => [community, ...cs])}
        />
      )}
    </div>
  );
};

export default ManageCommunities;
