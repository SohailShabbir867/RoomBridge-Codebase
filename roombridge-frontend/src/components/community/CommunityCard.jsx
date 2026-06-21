import React from "react";
import { Link } from "react-router-dom";
import { RiGroupLine, RiLockLine, RiMegaphoneLine } from "react-icons/ri";

const DK = "#012D1D";
const ACC = "#FFAB69";

/*
  CommunityCard — single card in the community browse grid.
  Props: community { _id, name, description, image, type, city, visibility, memberCount, isJoined }
*/
const CommunityCard = ({ community }) => {
  const { _id, name, description, image, type, city, visibility, memberCount, isJoined } = community;
  const isPrivate = visibility === "private";

  return (
    <Link
      to={`/communities/${_id}`}
      className="flex flex-col rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-md"
      style={{ borderColor: "#E8E2D9" }}
    >
      <div className="h-28 w-full relative" style={{ backgroundColor: `${DK}10` }}>
        {image?.url ? (
          <img src={image.url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: DK }}>
              {name?.[0]?.toUpperCase() || "C"}
            </span>
          </div>
        )}
        {isJoined && (
          <span
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: DK }}
          >
            Joined
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        <p className="font-bold text-sm leading-tight truncate flex items-center gap-1.5" style={{ color: DK }}>
          {name}
          {isPrivate && <RiLockLine className="text-xs text-gray-400" />}
          {type === "announcement" && <RiMegaphoneLine className="text-xs" style={{ color: ACC }} />}
        </p>

        {description && (
          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-400">{city || (type === "announcement" ? "Platform-wide" : type)}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: DK }}>
            <RiGroupLine className="text-xs" />
            {memberCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CommunityCard;
