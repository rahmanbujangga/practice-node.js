const AppError = require('../utils/appError');

const handleJwtError = () => {
  return new AppError('Invalid token. Please login first!', 401);
};

const handleJwtExpire = () => {
  return new AppError('Your token is expired. Please login again!', 401);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);

  return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
};

const handleDupError = (err) => {
  const value = err.errmsg.match(/"([^"]*)"/g);
  const name = value[0].replace(/"/g, '');

  return new AppError(`The tour name of ${name} are already taken`, 400);
};

const sendErrorDev = (err, req, res) => {
  //error of api request
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //error from view will show erro page
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('ERROR :', err);

    return res.status(500).json({
      status: 'error',
      message: 'Something wrong happened!',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  console.error('ERROR :', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Something gone wrong. Please try again later !',
  });
};

module.exports = (err, req, res, next) => {
  console.log(err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.name = err.name;
    error.errmsg = err.errmsg;
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDupError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError(error);
    if (error.name === 'TokenExpiredError') error = handleJwtExpire(error);

    sendErrorProd(error, req, res);
  }
};
