const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    // this errors is created if there is a problem with request
    const err = new HttpError("smt went wrong , could not find a place", 500);
    return next(err);
  }

  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided id.", 404)
    );
  }
  // to change it from monodb objectvto js object and get rid of underscore in front of id
  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  // try {
  //   places = await Place.find({ creator: userId });
  // } catch (error) {
  //   const err = new HttpError("fetching places failed , please try again", 500);
  //   return next(err);
  // }
  let userPlaces;
  try {
    userPlaces = await User.findById(userId).populate("places");
  } catch (error) {
    const err = new HttpError("fetching places failed , please try again", 500);
    return next(err);
  }
  if (!userPlaces || userPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find a places for the provided user id.", 404)
    );
  }

  res.json({
    places: userPlaces.places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    const err = new HttpError("Creating place failed,please try again.", 500);
    return next(err);
  }
  if (!user) {
    const err = new HttpError("Couldn't find the given user id.", 404);
    return next(err);
  }
  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    console.log(user.places);
    await user.save({ session: sess });
    await sess.commitTransaction();
    console.log(user);
  } catch (error) {
    const err = new HttpError("Creating place failed,please try again.", 500);
    return next(err);
  }

  res.status(201); //smt was successfully created
  res.status(201).json({ place: createdPlace });

  // res.json({ place: createdPlace.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError("smt went wrong , could not update a place", 500);
    return next(err);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (error) {
    const err = new HttpError("smt went wrong , could not update a place", 500);
    return next(err);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    const err = new HttpError("smt went wrong , could not update a place", 500);
    return next(err);
  }
  if (!place) {
    const err = new HttpError("Could not find a place for given id", 404);
    return next(err);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("smt went wrong , could not delete a place", 500);
    return next(err);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ msg: "just deleted" });
};

const ratePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  const { raterId, raterRating } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {}

  if (place.rate.raterIds.includes(raterId)) {
    let indexNumber = place.rate.raterIds.indexOf(raterId);
    place.rate.raterRates[indexNumber] = raterRating;
  } else {
    place.rate.raterIds.push(raterId);
    place.rate.raterRates.push(raterRating);
  }
  place.rate.averageRating =
    place.rate.raterRates.reduce((a, b) => a + b) /
    place.rate.raterRates.length;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );

    return next(error);
  }

  res.status(200).json({ rate: place.rate });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.ratePlace = ratePlace;
