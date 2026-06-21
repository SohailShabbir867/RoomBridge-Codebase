const mongoose = require("mongoose");

/* Reuses the same city list as User.model.js and Listing.model.js so a
   community's `city` field always lines up with valid platform cities.
   Kept as a local constant (not imported) to avoid creating a cross-model
   require cycle — copy stays in sync manually if the master list changes. */
const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Murree",
];

/** Sub-schema for the community's cover/avatar image (mirrors profilePhotoSchema
 *  in User.model.js — same { url, public_id } Cloudinary shape, no auto _id). */
const communityImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
  },
  { _id: false },
);

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      minlength: [3, "Community name must be at least 3 characters"],
      maxlength: [60, "Community name cannot exceed 60 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    image: {
      type: communityImageSchema,
      default: () => ({ url: "", public_id: "" }),
    },

    /* "city"         -> a hyperlocal group tied to one Pakistani city
       "announcement" -> a platform-wide admin broadcast channel
       "general"      -> any other admin-created topic group (events, FAQs, etc.) */
    type: {
      type: String,
      required: [true, "Community type is required"],
      enum: {
        values: ["city", "announcement", "general"],
        message: "{VALUE} is not a valid community type",
      },
      default: "city",
    },

    /* Required only when type === "city"; validated in the controller
       rather than here so "announcement"/"general" communities can omit it
       without fighting Mongoose's conditional-required syntax. */
    city: {
      type: String,
      trim: true,
      enum: {
        values: PAKISTAN_CITIES,
        message: "{VALUE} is not a supported city",
      },
    },

    /* PRIVATE  -> only admin (and members, read-only) can see messages;
                   regular members cannot post — view-only announcement style.
       PUBLIC   -> any joined member can both read and send messages. */
    visibility: {
      type: String,
      required: true,
      enum: {
        values: ["public", "private"],
        message: "Visibility must be either public or private",
      },
      default: "public",
    },

    /* Only admins can create communities — enforced in the controller via
       authorize("admin"), but we also store who created it for auditing. */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator (admin) is required"],
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Indexes ───────────────────────────────────────────── */
communitySchema.index({ type: 1 });
communitySchema.index({ city: 1 });
communitySchema.index({ visibility: 1 });
communitySchema.index({ isActive: 1, createdAt: -1 });
/* Prevent two active "city" communities for the same city by accident.
   Partial index so it only applies to type === "city" documents. */
communitySchema.index(
  { city: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "city" },
  },
);

/* ── Pre-save: keep memberCount in sync with members.length ──
   Avoids a separate countDocuments()/aggregate() query every time the
   member list is read — memberCount is denormalized for fast list views. */
communitySchema.pre("save", function () {
  if (this.isModified("members")) {
    this.memberCount = this.members.length;
  }
});

/* ── Instance helper ───────────────────────────────────── */
communitySchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.toString() === userId.toString());
};

/** Whether a given user role/membership can SEND messages here.
 *  - Public community: any joined member can send.
 *  - Private community: nobody except the admin who created it can send
 *    (view-only for members) — admin still posts via the normal admin role check. */
communitySchema.methods.canSend = function (userId, userRole) {
  if (userRole === "admin") return true;
  if (this.visibility === "private") return false;
  return this.isMember(userId);
};

module.exports = mongoose.model("Community", communitySchema);
