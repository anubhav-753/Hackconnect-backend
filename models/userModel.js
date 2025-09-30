const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },

    status: { type: String, default: 'Not Available' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '/uploads/default.png' },

    achievements: { type: String, default: '' },
    skills: { type: [String], default: [] },
    college: { type: String, default: '' },
    state: { type: String, default: '' },
    branch: { type: String, default: '' },

    socialLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },

    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // incoming requests
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // accepted requests
  },
  { timestamps: true }
);

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;