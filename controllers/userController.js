const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//Para almacenar las imagenes en memoria
const multerStorage = multer.memoryStorage();

//Para validar que el arhivo subido sea una imagen
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

//Para la subida de imagenes
exports.uploadUserPhoto = upload.single('photo');

//Para cambiar el tamaño y la forma a las imagenes
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //Si no se esta actualizando la imagen, entonces se continua con el ejecucion
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//Funcion que retorna solo los campos definidos por el usuario
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Se crea un error si el usuario ingreso los datos de la contraseña
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword'
      )
    );
  }
  //2. Se filtran los datos para obtener solo los que queremos actualizar, en
  //este caso seria el nombre y el email los que queremos actualizar
  const filterBody = filterObj(req.body, 'name', 'email');

  //Si se esta actualizando la imagen, entonces se actualiza el filterBody
  if (req.file) filterBody.photo = req.file.filename;

  //3. Se actualiza el documento (datos) del usuario
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

//Con esto no se actualizan la contraseña del usuario
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
