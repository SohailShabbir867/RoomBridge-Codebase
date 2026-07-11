import React from "react";
import communityService from "../../services/communityService";
import { RiLoader4Line, RiShieldStarLine, RiUserLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const DK  = "#012D1D";
const ACC = "#FFAB69";

/*
  CommunityMemberList — sidebar/sheet list of joined members.
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
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load members."))
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <RiLoader4Line className="animate-spin text-xl" style={{ color: DK }} />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <RiUserLine className="text-2xl text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No members yet</p>
      </div>
    );
  }

  /* Separate admins from regular members */
  const admins  = members.filter((m) => m.role === "admin");
  const regular = members.filter((m) => m.role !== "admin");

  const MemberRow = ({ m }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 transition-colors">
      {m.profilePhoto?.url ? (
        <img src={m.profilePhoto.url} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
          style={{ backgroundColor: m.role === "admin" ? ACC : DK }}>
          {(m.name || "?")[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: DK }}>{m.name}</p>
        {m.city && <p className="text-[10px] text-gray-400 truncate">{m.city}</p>}
      </div>
      {m.role === "admin" && (
        <RiShieldStarLine className="text-base shrink-0" style={{ color: ACC }} title="Admin" />
      )}
    </div>
  );

  return (
    <div className="flex flex-col py-3">
      {admins.length > 0 && (
        <>
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 px-4 mb-1.5">
            Admins ({admins.length})
          </p>
          {admins.map((m) => <MemberRow key={m._id} m={m} />)}
          <div className="my-2 mx-4 border-t" style={{ borderColor: "#F3EFE9" }} />
        </>
      )}

      <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 px-4 mb-1.5">
        Members ({regular.length})
      </p>
      {regular.map((m) => <MemberRow key={m._id} m={m} />)}
    </div>
  );
};

export default CommunityMemberList;
