const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  user.password = undefined;
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email or password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    console.log(password);
    console.log(user.password);

    return next(new AppError('Invalid email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //check token in header
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //error if no token

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  //verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still in database
  const existedUser = await User.findOne({ _id: decoded.id });
  //error if user not exist
  if (!existedUser) {
    return next(new AppError('The user is no longer exist'));
  }

  //check if password has been changed
  if (existedUser.checkPasswordChangedAt(decoded.iat)) {
    return next(
      new AppError(
        'Your password has been changed recently! Please login again'
      )
    );
  }
  // set user to req
  req.user = existedUser;

  // set user for template
  res.locals.user = existedUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  //check jwt and cookies then verify
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      console.log(decoded);

      //verify user
      const currentUser = await User.findById(decoded.id);
      console.log(currentUser);

      if (!currentUser) {
        return next();
      }

      //check if user changed the password
      if (currentUser.checkPasswordChangedAt(decoded.iat)) {
        return next();
      }
      //keep user in locals for template
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //find the user based on email
  const user = await User.findOne({ email: req.body.email });

  //error if user not exist
  if (!user) {
    return next(new AppError('No user with such email address', 404));
  }

  //generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    //create reset url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    //send token to user email
    await new Email(user, resetUrl).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Email has been sent',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Please try again', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //encrypt token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //find the user
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  console.log(user);

  if (!user) return next(new AppError('Token is invalid or expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from database
  const user = await User.findById(req.user.id).select('+password');

  //check request password body same to current password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('You enter the wrong password', 401));
  }

  //if yes, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
