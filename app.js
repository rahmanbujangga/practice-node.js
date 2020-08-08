const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//set template view engine to pug
app.set('view engine', 'pug');

//set path of views
app.set('views', path.join(__dirname, 'views'));

//middleware using static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet({ limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Your IP reach max request, please try again later',
});

app.use('/api', limiter);

//parse data from req body
app.use(express.json());

//parse data from cookie
app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//sanitize from nosql query injection
app.use(mongoSanitize());

//sanitize against xss(cross-site-scripting)
app.use(xssClean());

//prevent param pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Routes

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(`Can't find the path:${req.originalUrl} in this server`, 404)
  );
});

app.use(globalErrorHandler);

module.exports = app;
