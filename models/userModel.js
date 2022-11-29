const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //Esto solo funciona al guardar el usuario
      validator: function(el) {
        return el === this.password;
      },
      message: 'Paswords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//Para encriptar la contraseña con bcrypt al momento
//de guardar el usuario en la BD
userSchema.pre('save', async function(next) {
  //Si password esta no esta siendo modificado se continua
  //con la ejecucion del codigo
  if (!this.isModified('password')) return next();

  //Si esta siendo modificado se encripta la contraseña
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

//Para mostrar solo a los usuarios activos al hacer un find
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

//Verifica si la contraseña esta siendo modificada para
//asignar la fecha en la que cambio la contraseña
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Funcion instanciada: que se puede invocar en todos los documentos de usuario
//Para determinar si la contraseña ingresada es correcta
//compara la contraseña encriptada con la ingresada por el
//usuario al momento de iniciar sesion
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Verifica si la contraseña fue cambiada
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimesStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimesStamp;
  }

  return false;
};

//Funcion instanciada que genera un token aleatorio para el
//restablecimiento de la contraseña
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Para convertir a milisegundos

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
