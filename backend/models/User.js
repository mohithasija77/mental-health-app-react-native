const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local'; // only require password for normal signup
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    oauth: {
      google: String,
      facebook: String,
      // Add other providers as needed
    },
    profilePicture: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordOtp: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but enforces uniqueness for non-null values
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'both'],
      default: 'email',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to get user without password
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Method to compare password (for email/password login)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false; // No password set (Google OAuth user)
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can login with password
userSchema.methods.canLoginWithPassword = function () {
  return (
    this.password &&
    (this.authProvider === 'email' || this.authProvider === 'both')
  );
};

// Method to check if user can login with Google
userSchema.methods.canLoginWithGoogle = function () {
  return (
    this.googleId &&
    (this.authProvider === 'google' || this.authProvider === 'both')
  );
};

module.exports = mongoose.model('User', userSchema);
