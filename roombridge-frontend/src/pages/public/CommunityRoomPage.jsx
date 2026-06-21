import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import CommunityChatBox from "../../components/community/CommunityChatBox";
import CommunityMemberList from "../../components/community/CommunityMemberList";
import { RiArrowLeftLine } from "react-icons/ri";

const DK = "#012D1D";
const CR = "#F7F4EF";

/*
  CommunityRoomPage — full room view at /communities/:id.
  Chat takes the main column; member list shows as a sidebar on desktop,
  hidden on mobile to keep the chat usable on small screens (members can
  still be viewed in a future "view members" sheet if needed later).
*/
const CommunityRoomPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [memberCount, setMemberCount] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-bold" style={{ color: DK }}>
          Please log in to view this community
        </p>
        <Link to="/login" className="mt-3 text-sm font-bold underline" style={{ color: DK }}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: DK }}
      >
        <RiArrowLeftLine /> Back to communities
      </Link>

      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-0 rounded-2xl border overflow-hidden"
        style={{ borderColor: "#E8E2D9", height: "70vh", backgroundColor: CR }}
      >
        <CommunityChatBox communityId={id} onMemberCountChange={setMemberCount} />

        <div className="hidden lg:block border-l overflow-y-auto bg-white" style={{ borderColor: "#E8E2D9" }}>
          <CommunityMemberList communityId={id} />
        </div>
      </div>
    </div>
  );
};

export default CommunityRoomPage;
