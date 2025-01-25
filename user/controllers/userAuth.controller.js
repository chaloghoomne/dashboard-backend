const User = require("../models/user.model");
const genToken = require("../../utils/genToken");
const bcrypt = require("bcrypt");
const userValidator = require("../../validators/user.validators");
const userVerification = require("../models/userVerification.model");
const sendMail = require("../../utils/sendMail");
const uploadImages = require("../../utils/uploadImages");
const OTP = require("../models/otp.model");
const genRandomId = require("../../utils/genRandomId");
const Newsletter = require("../models/newsletter.model");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async userSignup(req, res) {
    try {
      const data = req.body;

      const otpDoc = await OTP.findOne({ email: data.email });

      const phoneVerificationDoc = await userVerification.findOne({
        phoneNumber: data.phoneNumber,
      });

      if (!otpDoc && !otpDoc?.isEmailVerified) {
        return res
          .status(400)
          .json({ message: "Email not verified", success: false });
      }

      if (!phoneVerificationDoc && !phoneVerificationDoc?.isPhoneVerified) {
        return res
          .status(400)
          .json({ message: "Mobile not verified", success: false });
      }

      const checkEmailExist = await User.findOne({ email: data.email });
      const checkPhoneNumberExist = await User.findOne({
        phoneNumber: data.phoneNumber,
      });

      if (checkEmailExist) {
        return res.status(409).json({
          message: "Email already exists",
          success: false,
        });
      }

      if (checkPhoneNumberExist) {
        return res.status(409).json({
          message: "Phone Number already exists",
          success: false,
        });
      }
      data.userId = genRandomId("CG");
      data.password = await bcrypt.hash(data.password, 10);
      const user = await User.create(data);
      await sendMail({
        email: data.email,
        subject: "User Signup",
        text: `Welcome to Chalo Ghoomne!

Dear ${data.firstName},

Thank you for signing up with Chalo Ghoomne! We're excited to have you join our community.

Your account has been successfully created. You can now log in and start exploring all the great features and benefits we offer.

To get started, click the link below to verify your email address and activate your account:

[Verification Link]

If you have any questions or need assistance, feel free to reach out to our support team at b2b@chaloghoomne.com or visit our www.chaloghoomne.com.

We look forward to having you with us!

Best regards,
The Chalo Ghoomne Team
  `,
      });
      return res
        .status(201)
        .json({ success: true, message: "User created", data: user });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userLogin(req, res) {
    try {
      const { credential, password, deviceToken } = req.body;
      const user = await User.findOne({
        $or: [{ email: credential }, { phoneNumber: credential }],
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      if (user.isBlocked) {
        return res
          .status(400)
          .json({ message: "You are blocked.", success: false });
      }

      if (user.isSuspended) {
        user.suspendedUntill = new Date(
          user.suspendedUntill
        ).toLocaleDateString();
        return res.status(400).json({
          message: `You are suspended untill ${user.suspendedUntill}`,
          success: false,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid Credentials", success: false });
      }
      const token = await genToken({ id: user._id });

      await User.findByIdAndUpdate(user._id, { $set: { deviceToken, token } });

      return res.status(200).json({
        token,
        userId: user._id,
        success: true,
        message: "Login successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
  // async userSignup(req, res) {
  //   try {
  //     const data = req.body;
  //     data.email = String(data.email).toLowerCase();
  //     const parsedData = userValidator.userSignupSchema.safeParse(data);

  //     const checkVerifiedUser = await userVerification.findOne({
  //       email: data.email,
  //     });

  //     if (!userVerification) {
  //       return res.status(400).json({
  //         message: "Email is not verified",
  //         success: false,
  //       });
  //     }

  //     if (!checkVerifiedUser.isEmailVerified) {
  //       return res.status(400).json({
  //         message: "Email is not verified",
  //         success: false,
  //       });
  //     }
  //     if (!checkVerifiedUser.isPhoneVerified) {
  //       return res.status(400).json({
  //         message: "Phone Number is not verified",
  //         success: false,
  //       });
  //     }

  //     if (!parsedData.success) {
  //       return res.status(400).json({
  //         error: parsedData.error.errors,
  //         success: false,
  //         message: "Invalid Data",
  //       });
  //     }

  //     const existingUser = await User.findOne({ email: data.email });

  //     if (existingUser) {
  //       return res
  //         .status(409)
  //         .json({ message: "User already exists", success: false });
  //     }

  //     data.password = await bcrypt.hash(data.password, 10);

  //     const user = await User.create(data);
  //     return res.status(201).json({ success: true });
  //   } catch (error) {
  //     res.status(500).json({
  //       error: error.message,
  //       message: "Internal Server Error",
  //       success: false,
  //     });
  //   }
  // },

  // async userLogin(req, res) {
  //   try {
  //     const data = req.body;
  //     data.email = String(data.email).toLowerCase();

  //     const parsedData = userValidator.userLoginSchema.safeParse(data);

  //     if (!parsedData.success) {
  //       return res.status(400).json({
  //         error: parsedData.error.errors,
  //         success: false,
  //         message: "Invalid Data",
  //       });
  //     }

  //     const user = await User.findOne({ email: data.email });

  //     if (!user) {
  //       return res
  //         .status(404)
  //         .json({ message: "User not found", success: false });
  //     }

  //     if (user.isBlocked) {
  //       return res
  //         .status(400)
  //         .json({ message: "You are blocked.", success: false });
  //     }

  //     if (user.isSuspended) {
  //       user.suspendedUntill = new Date(
  //         user.suspendedUntill
  //       ).toLocaleDateString();
  //       return res.status(400).json({
  //         message: `You are suspended untill ${user.suspendedUntill}`,
  //         success: false,
  //       });
  //     }

  //     const isMatch = await bcrypt.compare(data.password, user.password);

  //     if (!isMatch) {
  //       return res
  //         .status(400)
  //         .json({ message: "Invalid Credentials", success: false });
  //     }

  //     const token = await genToken({ id: user._id });

  //     return res
  //       .status(200)
  //       .json({ token, success: true, message: "Login successfully" });
  //   } catch (error) {
  //     res.status(500).json({
  //       error: error.message,
  //       message: "Internal Server Error",
  //       success: false,
  //     });
  //   }
  // },

  async userForgotPassword(req, res) {
    try {
      const { phoneNumber } = req.body;

      const existPhoneNumber = await User.findOne({ phoneNumber });

      if (!existPhoneNumber) {
        return res.status(404).json({
          message: "Phone number does not exist",
          success: false,
        });
      }

      await userVerification.deleteMany({ phoneNumber });

      const otp = Math.floor(100000 + Math.random() * 900000);

      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      const newVerificationDoc = await userVerification.create({
        phoneNumber,
        otp,
        otpExpiry,
      });

      let OTP_URL = `https://mobicomm.dove-sms.com//submitsms.jsp?user=${process.env.OTP_USER}&key=${process.env.OTP_KEY}&mobile=+91${phoneNumber}&message=Your One-Time Password (OTP) is ${otp} Please enter this code to proceed. Thanks trip NSL LIFE&senderid=NSLSMS&accusage=1&entityid=${process.env.OTP_ENTITY_ID}&tempid=${process.env.OTP_TEMPLATE_ID}`;

      let otpRequest = await fetch(OTP_URL);
      let response = await otpRequest.text();
      return res.status(200).json({ success: true, message: "OTP sent" });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async sendMobileOtp(req, res) {
    try {
      const { phoneNumber } = req.body;

      const existPhoneNumber = await User.findOne({ phoneNumber });

      if (existPhoneNumber) {
        return res.status(404).json({
          message: "Phone number already exists",
          success: false,
        });
      }

      await userVerification.deleteMany({ phoneNumber });

      const otp = Math.floor(100000 + Math.random() * 900000);

      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      const newVerificationDoc = await userVerification.create({
        phoneNumber,
        otp,
        otpExpiry,
      });

      let OTP_URL = `https://mobicomm.dove-sms.com//submitsms.jsp?user=${process.env.OTP_USER}&key=${process.env.OTP_KEY}&mobile=+91${phoneNumber}&message=Your One-Time Password (OTP) is ${otp} Please enter this code to proceed. Thanks trip NSL LIFE&senderid=NSLSMS&accusage=1&entityid=${process.env.OTP_ENTITY_ID}&tempid=${process.env.OTP_TEMPLATE_ID}`;

      let otpRequest = await fetch(OTP_URL);
      let response = await otpRequest.text();
      return res.status(200).json({ success: true, message: "OTP sent" });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userChangePassword(req, res) {
    try {
      const data = req.body;

      const userVerificationDoc = await userVerification.findOne({
        phoneNumber: data.phoneNumber,
      });

      if (!userVerificationDoc?.isPhoneVerified) {
        return res.status(400).json({
          message: "Phone number is not verified",
          success: false,
        });
      }

      const user = await User.findOne({ phoneNumber: data.phoneNumber });

      user.password = bcrypt.hashSync(data.password, 10);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userResetPassword(req, res) {
    try {
      const data = req.body;

      if (data.newPassword !== data.confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match",
          success: false,
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(400).json({
          message: "User doesn't exist",
          success: false,
        });
      }

      const isMatch = bcrypt.compareSync(data.oldPassword, user.password);

      if (!isMatch) {
        return res.status(500).json({
          message: "Old Password doesn't match",
          success: false,
        });
      }

      user.password = bcrypt.hashSync(data.newPassword, 10);

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userGoogleLogin(req, res) {
    try {
      const data = req.body;

      const user = await User.findOne({ email: data.email });

      if (user && user.googleAuth === false) {
        return res.status(400).json({
          message: "Email already exists",
          success: false,
        });
      }

      if (!user) {
        const createUser = await User.create({ ...data, googleAuth: true });

        const otp = await OTP.create({
          email: data.email,
          otp: null,
          otpExpiry: null,
          isEmailVerified: true,
        });

        if (data.phoneNumber) {
          const userVerificationDoc = await userVerification.create({
            phoneNumber: data.phoneNumber,
            isPhoneVerified: true,
            otp: null,
            otpExpiry: null,
          });
        }

        const token = await genToken({ id: createUser._id, isUser: true });
        return res.status(201).json({
          data: token,
          success: true,
          message: "Logged in successfully",
        });
      } else {
        await User.findByIdAndUpdate(user._id, {
          deviceToken: data.deviceToken,
        });
        const token = await genToken({ id: user._id, isUser: true });
        return res.status(200).json({
          data: token,
          success: true,
          message: "Logged in successfully",
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteAccount(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      await user.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Invalid Server Error",
      });
    }
  },

  async verifyMobileOtp(req, res) {
    try {
      const { phoneNumber, otp } = req.body;
      let checkVerifiedUser = await userVerification.findOne({
        phoneNumber: phoneNumber,
      });

      if (!checkVerifiedUser) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      if (checkVerifiedUser.otp !== otp) {
        return res.status(400).json({
          message: "Invalid OTP",
          success: false,
        });
      }
      checkVerifiedUser.isPhoneVerified = true;
      await checkVerifiedUser.save();
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Invalid Server Error",
      });
    }
  },

  async userProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      return res.status(200).json({
        data: user,
        success: true,
        message: "User profile fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userEditProfile(req, res) {
    try {
      let data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      const { id } = req.params;

      let images = [];

      // if (image) {
      //   const fileBuffer = image.buffer;
      //   const fileName = `${Date.now()}-${image.originalname}`;

      //   const imageUrl = await uploadToBunny(fileBuffer, fileName);
      //   console.log("imageURL", imageUrl);
      //   data.image = imageUrl;
      // }
      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: id,
      //     modelName: "User",
      //     field: "image",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then((results) => {
      //       console.log("All uploads completed", results);
      //       // Handle the results as needed
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // }

      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!user) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async sendMailOtp(req, res) {
    try {
      let { email } = req.body;
      email = String(email).toLowerCase();
      await OTP.deleteMany({ email });

      // make 6 digit otp
      const otp = Math.floor(100000 + Math.random() * 900000);
      // set otp expiry time to 5 minutes from now
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      // save otp and email in database
      await OTP.create({ email, otp, otpExpiry });

      // send mail to the user with the otp
      const mailOptions = {
        email: email, // This is where the email is passed correctly
        subject: "OTP for verification",
        text: `Your OTP is ${otp}`,
      };

      const mail = await sendMail(mailOptions);
      console.log(mail);

      if (!mail) {
        return res.status(500).json({
          message: "Error sending email",
          success: false,
        });
      }
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async verifyMailOtp(req, res) {
    try {
      const { email, otp } = req.body;

      const otpDoc = await OTP.findOne({ email, otp });

      if (!otpDoc) {
        return res.status(400).json({
          message: "Invalid OTP",
          success: false,
        });
      }

      // check if otp is not expired
      if (otpDoc.otpExpiry < new Date()) {
        return res.status(400).json({
          message: "OTP expired",
          success: false,
        });
      }

      otpDoc.isEmailVerified = true;
      await otpDoc.save();

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        message: "User fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async updateDeviceToken(req, res) {
    try {
      const { deviceToken } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          deviceToken,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Device token updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
