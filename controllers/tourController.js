const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

// Datei wird in den Arbeitsspeicher (buffer) geladen
const multerStorage = multer.memoryStorage();

// Datei wird gefiltert, d.h. nur image-Dateien können hochgeladen werden
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
// Datei wird hochgeladen
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
// 3 mögliche Fälle des Hochladens von images

// a) sowohl ein imageCover als auch images werden hochgeladen
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
// // b) es wird nur ein imageCover hochgeladen
// upload.single('image'); // req.file
// // c) nur images werden hochgeladen
// upload.array('images', 5); // req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // Cover image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg}`;

  await sharp(req.files.imageCover[0].buffer) // lädt aus dem Arbeitsspeicher s.o.
    .resize(2000, 1333) // width, height
    .toFormat('jpeg') // wird immer zu einem jpeg-Format konvertiert
    .jpeg({ quality: 90 }) // die Qualität soll 90 % des Orginals sein
    .toFile(`public/img/tours/${req.body.imageCover}`); // und auf der Festplatte mit dem angeführten Verzeichnis gespeichert werden

  // Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg}`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  // Anm: updateOne(Tour) erwartet als Argument req.body (vgl. handlerFactory) und das Tour-Schema ein Array (vgl. images bei tourModel ); daher req.body.images
  // re.files.images.map() gibt ein Array von Promises der Dateinamen der resiztes Images zurück
  // diese Promises werden mit Promise.all() alle gleichzeitig ausgeführt
  // erst wenn diese alle zurück sind, dann kann die nächste Middleware (updateOne(Tour)) ausgeführt werden
  // die einzelen filenames müssen in ein req.body.images-Array überführt werden; daher req.body.images.push(filename)
  next(); // = updateOne(Tour), s.u.
});

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // { $match: { _id: { $ne: 'EASY' } } }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
// center: Latitude und Longitude des aktuellen Standorts
// distance: Radius um dem aktuellen Standorts
// unit: mi = Meilen, ansonsten Kilometer

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);
  // findet die Touren vom aktuellen Standort innerhalb eines bestimmten Radius
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});
// ermittelt die Entfernungen von allen Touren, ausgehend von einem Startpunkt (latlng)
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        // nur die Distanz und der Name der Tour soll angezeigt werden
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
