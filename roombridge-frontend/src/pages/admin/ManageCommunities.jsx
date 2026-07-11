import React, { useEffect, useState } from "react";
import communityService from "../../services/communityService";
import CreateCommunityModal from "../../components/community/CreateCommunityModal";
import toast from "react-hot-toast";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import {
  RiLoader4Line,
  RiAddLine,
  RiDeleteBinLine,
  RiLockLine,
  RiGroupLine,
  RiEditLine,
} from "react-icons/ri";

const DK = "#012D1D";
const ACC = "#FFAB69";

/*
  ManageCommunities — admin dashboard page (/admin/communities).
*/
const ManageCommunities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
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

  const handleUpdated = (updated) => {
    setCommunities((cs) => cs.map((c) => (c._id === updated._id ? updated : c)));
  };

  return (
    <RoleDashboardLayout
      role="admin"
      title="Manage Communities"
      subtitle="Create city groups or announcement channels for RoomBridge users."
      headerAction={
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white cursor-pointer active:scale-95 shadow-sm"
          style={{ backgroundColor: DK }}
        >
          <RiAddLine className="text-base" />
          New Community
        </button>
      }
    >
      <div className="max-w-5xl mx-auto py-4">

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
        <>
          {/* Card list for mobile screens */}
          <div className="block md:hidden space-y-4">
            {communities.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border p-4 space-y-4 shadow-sm animate-fade-in"
                style={{ borderColor: "#E8E2D9" }}
              >
                <div className="flex items-center gap-3">
                  {c.image?.url ? (
                    <img src={c.image.url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: ACC }}
                    >
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm truncate" style={{ color: DK }}>
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 capitalize">{c.type} community</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {c.city && (
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                      {c.city}
                    </span>
                  )}
                  {c.visibility === "private" ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      <RiLockLine className="text-[10px]" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Public
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full font-medium">
                    <RiGroupLine className="text-[10px]" /> {c.memberCount ?? 0} members
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-end gap-3" style={{ borderColor: "#F0EBE3" }}>
                  <button
                    onClick={() => setSelectedCommunity(c)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-600 border px-3 py-1.5 rounded-full hover:bg-gray-50 cursor-pointer active:scale-95 transition-all"
                    style={{ borderColor: "#E8E2D9" }}
                  >
                    <RiEditLine className="text-xs" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-50 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                  >
                    {deletingId === c._id ? (
                      <RiLoader4Line className="animate-spin text-xs" />
                    ) : (
                      <RiDeleteBinLine className="text-xs" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table view for desktop screens */}
          <div className="hidden md:block rounded-2xl border overflow-hidden bg-white shadow-sm" style={{ borderColor: "#E8E2D9" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400" style={{ borderColor: "#E8E2D9" }}>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communities.map((c) => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#F0EBE3" }}>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {c.image?.url ? (
                        <img src={c.image.url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: ACC }}
                        >
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[200px]" style={{ color: DK }}>
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{c.type}</td>
                    <td className="px-4 py-3 text-gray-500">{c.city || "—"}</td>
                    <td className="px-4 py-3">
                      {c.visibility === "private" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <RiLockLine className="text-[10px]" /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Public</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <RiGroupLine className="text-xs" /> {c.memberCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => setSelectedCommunity(c)}
                          aria-label="Edit community"
                          className="text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <RiEditLine className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          disabled={deletingId === c._id}
                          aria-label="Delete community"
                          className="text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          {deletingId === c._id ? (
                            <RiLoader4Line className="animate-spin text-base" />
                          ) : (
                            <RiDeleteBinLine className="text-base" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={(community) => setCommunities((cs) => [community, ...cs])}
        />
      )}

      {selectedCommunity && (
        <CreateCommunityModal
          community={selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
          onUpdated={handleUpdated}
        />
      )}
      </div>
    </RoleDashboardLayout>
  );
};

export default ManageCommunities;
