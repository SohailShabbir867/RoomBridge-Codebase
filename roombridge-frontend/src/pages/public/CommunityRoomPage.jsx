import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import CommunityChatBox from "../../components/community/CommunityChatBox";
import CommunityMemberList from "../../components/community/CommunityMemberList";
import { RiArrowLeftLine, RiGroupLine, RiCloseLine } from "react-icons/ri";

const DK = "#012D1D";
const CR = "#F7F4EF";

/*
  CommunityRoomPage — full room view at /communities/:id.

  Layout:
  • Desktop (lg+): chat | member sidebar (side-by-side)
  • Mobile: chat full-screen, member list slides up from a bottom sheet
    toggled by a "Members" pill in the chat header.
*/
const CommunityRoomPage = () => {
  const { id }                    = useParams();
  const { isAuthenticated }       = useSelector((s) => s.auth);
  const [memberCount, setMemberCount] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: `${DK}10` }}>
          <RiGroupLine className="text-2xl" style={{ color: DK }} />
        </div>
        <p className="font-extrabold text-base mb-2" style={{ color: DK }}>
          Login required
        </p>
        <p className="text-sm text-gray-400 mb-5">
          You need to be logged in to view this community.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: DK }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100dvh - 64px)",  /* fill viewport below navbar */
        backgroundColor: CR,
      }}
    >
      {/* Back bar */}
      <div className="bg-white border-b px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm"
        style={{ borderColor: "#E8E2D9" }}>
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-sm font-bold"
          style={{ color: DK }}
        >
          <RiArrowLeftLine className="text-base" /> Communities
        </Link>

        {/* Mobile members toggle */}
        <button
          onClick={() => setShowMembers((s) => !s)}
          className="lg:hidden inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
          style={{
            backgroundColor: showMembers ? DK : "#F5F2EB",
            color: showMembers ? "#FFF" : DK,
          }}
        >
          <RiGroupLine />
          {memberCount !== null ? `${memberCount} Members` : "Members"}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Chat */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <CommunityChatBox communityId={id} onMemberCountChange={setMemberCount} />
        </div>

        {/* Desktop sidebar */}
        <div
          className="hidden lg:flex flex-col border-l bg-white w-64 shrink-0 overflow-y-auto"
          style={{ borderColor: "#E8E2D9" }}
        >
          <CommunityMemberList communityId={id} />
        </div>

        {/* Mobile bottom sheet for members */}
        {showMembers && (
          <div className="lg:hidden absolute inset-0 z-30 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMembers(false)}
            />
            {/* Sheet */}
            <div
              className="relative bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
              style={{ animation: "slideUp 0.3s ease" }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0"
                style={{ borderColor: "#F3EFE9" }}>
                <p className="font-extrabold text-sm" style={{ color: DK }}>
                  Members {memberCount !== null && `(${memberCount})`}
                </p>
                <button
                  onClick={() => setShowMembers(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500"
                >
                  <RiCloseLine />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pb-safe">
                <CommunityMemberList communityId={id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityRoomPage;
