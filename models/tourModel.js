const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

//Se crea el esquema de la base de datos
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a dificulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 //Para que no tenga decimales
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      //Validaciones propias
      //Se verifica que el precio de descuento no sea mayor al precio estandar
      type: Number,
      validate: {
        validator: function(val) {
          //Las validaciones propias no funcionan cuando se va a actualizar el dato
          //Solo funciona cuando se va a crear un documento (dato) nuevo (.save)
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        //Child referencing
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
    // guides: Array //Si queremos hacer incrustacion debemos hacer esto
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//Indices, para que la BD agilice las busquedas
//el 1 en el precio quiere decir que las organice en
//orden ascendente, mientras que el -1 significa lo contrario
// tourSchema.index({ price: 1 });

//Indice compuesto
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });

//Para las querys geoespaciales
tourSchema.index({ startLocation: '2dsphere' });

//Propiedades virtuales
//Esto sirve para tener otro campo en la BD pero no
//se pueden hacer consultas sobre este campo, ya que
//no forma parte de la BD como tal
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//Document middleware: se ejecuta antes del .save() y el .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Si queremos hacer incrustacion de los datos, se debe hacer esto
// tourSchema.pre('save', async function(next) {
//   //Debido a que el arreglo se llena de promesas, se deben resolver
//   //para obtener los documentos (datos) de los guias de los recorridos (tours)
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

//Este se ejecuta despues de guardar un documento o
//dato en la BD, los post y pre funcionan como disparadores
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//Query middleware
//^find para que encuentre todos los comandos que empiezan por
//find (find y findOne)
tourSchema.pre(/^find/, function(next) {
  //Para que no se muestren ciertos registros al momento
  //de hacer un get de los datos de la BD
  this.find({ secretTour: { $ne: true } });
  next();
});

//Populate es para poblar los datos en los que se referencien a
//cierto campo, en este caso, los guias (SOLO EN LA CONSULTA)
//El select es para que no aparezcan esos campos al hacer la consulta
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} millisenconds!`);
//   next();
// });

//Aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//Se crea un objeto a partir del esquema
// const testTour = new Tour({
//   name: 'The forest hiker',
//   rating: 4.7,
//   price: 497
// });

// testTour
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log('ERROR:', err);
//   });
