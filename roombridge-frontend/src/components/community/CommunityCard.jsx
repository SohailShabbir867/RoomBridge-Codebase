import React from "react";
import { Link } from "react-router-dom";
import {
  RiGroupLine,
  RiLockLine,
  RiMegaphoneLine,
  RiArrowRightLine,
} from "react-icons/ri";

const DK  = "#012D1D";
const ACC = "#FFAB69";

/*
  CommunityCard — single card in the community browse grid.
  Props: community { _id, name, description, image, type, city, visibility, memberCount, isJoined }
*/
const CommunityCard = ({ community }) => {
  const { _id, name, description, image, type, city, visibility, memberCount, isJoined } = community;
  const isPrivate = visibility === "private";

  const typeColor = type === "announcement" ? "#F0630020" : type === "city" ? "#012D1D15" : "#FFAB6920";
  const typeLabelColor = type === "announcement" ? "#F06300" : type === "city" ? DK : "#8E4E14";

  return (
    <Link
      to={`/communities/${_id}`}
      className="group flex flex-col rounded-[20px] border bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ borderColor: "#E8E2D9" }}
    >
      {/* Cover image / placeholder */}
      <div className="h-32 sm:h-36 w-full relative overflow-hidden" style={{ backgroundColor: `${DK}08` }}>
        {image?.url ? (
          <img
            src={image.url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-extrabold opacity-20" style={{ color: DK }}>
              {name?.[0]?.toUpperCase() || "C"}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Badges top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {isJoined && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm"
              style={{ backgroundColor: DK }}>
              Joined
            </span>
          )}
          {isPrivate && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center bg-black/30 text-white">
              <RiLockLine className="text-[9px]" />
            </span>
          )}
        </div>

        {/* Type chip bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          <span
            className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: typeLabelColor }}
          >
            {type === "announcement" ? <RiMegaphoneLine /> : <RiGroupLine />}
            {type === "announcement" ? "Announcement" : type === "city" ? "City" : "General"}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-extrabold text-sm leading-tight" style={{ color: DK }}>
          {name}
        </p>

        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: "#F3EFE9" }}>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <RiGroupLine className="text-xs" />
            <span className="font-bold" style={{ color: DK }}>{memberCount ?? 0}</span>
            <span>members</span>
            {city && <span className="text-gray-300 mx-1">·</span>}
            {city && <span>{city}</span>}
          </span>
          <RiArrowRightLine className="text-sm transition-transform group-hover:translate-x-1" style={{ color: ACC }} />
        </div>
      </div>
    </Link>
  );
};

export default CommunityCard;
