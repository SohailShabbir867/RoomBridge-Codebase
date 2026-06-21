import React from "react";
import communityService from "../../services/communityService";
import { RiLoader4Line, RiShieldStarLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const DK = "#012D1D";

/*
  CommunityMemberList — sidebar list of joined members for the open community.
  Only rendered for members/admin (route already enforces this via
  requireMembership on GET /communities/:id/members).
*/
const CommunityMemberList = ({ communityId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    communityService
      .getMembers(communityId)
      .then((res) => setMembers(res.data?.members || []))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load members."),
      )
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RiLoader4Line className="animate-spin text-xl" style={{ color: DK }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 px-2 mb-1">
        Members ({members.length})
      </p>
      {members.map((m) => (
        <div key={m._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5">
          {m.profilePhoto?.url ? (
            <img src={m.profilePhoto.url} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
              style={{ backgroundColor: DK }}
            >
              {(m.name || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm flex-1 truncate" style={{ color: DK }}>
            {m.name}
          </span>
          {m.role === "admin" && <RiShieldStarLine className="text-sm text-amber-500" title="Admin" />}
        </div>
      ))}
    </div>
  );
};

export default CommunityMemberList;
