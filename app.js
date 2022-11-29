const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

//Motor de plantillas que se usara para el frontend
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) MIDDLEWARES GLOBALES
//Definicion de los archivos estaticos
app.use(express.static(`${__dirname}/public`));
//Se configuran unos HTTP headers de seguridad
app.use(helmet());

//Para hacer login en modo de desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Para limitar el numero de peticiones por IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1 hora convertida a milisegundos
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

//Body parser, se leen los datos del body al req.body
//Solo acepta bodys de hasta 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //Analiza los datos de la url
app.use(cookieParser()); //Analiza los datos de las cookies

//Saneamiento de datos contra NoSQL query injection
app.use(mongoSanitize());

//Saneamineto de datso contra Cross-site scripting (XSS)
app.use(xss());

//Evita la polucion o contaminacion de parametros
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Si no tomo alguna de las rutas de arriba, quiere decir que la ruta ingresada
//no esta bien y se retorna un mensaje de error
app.all('*', (req, res, next) => {
  //Con el objeto de appError
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

//Middleware para manejo de errores (Error handling middleware)
app.use(globalErrorHandler);

module.exports = app;
