const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//Para obtener la checkout session de stripe para hacer pagos con tarjeta de credito
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //Para obtener el tour que se esta comprando
  const tour = await Tour.findById(req.params.tourId);

  //Se crea la checkout session de stripe para hacer el pago con tarjeta
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          }
        }
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    session
  });
});

//Crea la reserva en la BD al momento de hacer el pago con tarjeta
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  /*
    Esto es temporal, ya que con este metodo cualquier usuario puede hacer una
    reserva sin pagar, accediendo al url con los datos del recorrido y el usuario
    de manera manual
  */
  const { tour, user, price } = req.query;

  //Si no estan estos tres elementos, quiere decir que no se estan haciendo pagos
  //entonces redirige al home
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
