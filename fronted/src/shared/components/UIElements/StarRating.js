import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import ReactStars from "react-rating-stars-component";

import LoadingSpinner from "../UIElements/LoadingSpinner";
import Modal from "../UIElements/Modal";
import { useHttpClient } from "../../hooks/http-hook";
import { AuthContext } from "../../context/auth-context";
import ErrorModal from "./ErrorModal";
import Button from "../FormElements/Button";
import ConfirmModal from "./ConfirmModal";

import "./StarRating.css";

function StarRating({ placeId, rate }) {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [rating, setRating] = useState(rate.averageRating);
  const [ratingSameUser, setRatingSameUser] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmModal, setShowconfirmModal] = useState(false);
  const [raterNumb, setRaterNumb] = useState(rate.raterRates.length);

  const history = useHistory();
  //Login Modal
  const showWarningHandler = () => setShowLoginModal(true);
  const closeWarningHandler = () => setShowLoginModal(false);
  //Confirm Modal
  const showConfirmHandler = () => setShowconfirmModal(true);
  const closeConfirmHandler = () => setShowconfirmModal(false);

  const rateHandler = (ratingValue) => {
    if (!auth.token) {
      showWarningHandler();
    } else {
      if (rate.raterIds.includes(auth.userId)) {
        setRatingSameUser(ratingValue);
        showConfirmHandler();
      } else {
        setRating(ratingValue);
        patchRates(ratingValue);
      }
    }
  };

  const patchRates = async (ratingValue) => {
    closeConfirmHandler();

    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/places/rate/${placeId}`,
        "PATCH",
        JSON.stringify({
          raterId: auth.userId,
          raterRating: ratingValue || ratingSameUser,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      setRating(responseData.rate.averageRating);
      setRaterNumb(responseData.rate.raterRates.length);
    } catch (err) {}
  };

  return (
    <>
      {isLoading && <LoadingSpinner asOverlay />}
      <ErrorModal error={error} onClear={clearError} />
      <Modal
        show={showLoginModal}
        onCancel={closeWarningHandler}
        footerClass="place-item__modal-actions"
        footer={
          <Button
            inverse
            onClick={() => {
              history.push("/auth");
            }}
          >
            Log In
          </Button>
        }
      >
        <p>You must be logged in to be able to rate </p>
      </Modal>
      <ConfirmModal
        show={showConfirmModal}
        onClear={closeConfirmHandler}
        confirm={() => patchRates(ratingSameUser)}
        message=" You've already rate this pleace, Do you want to change your rating
        anyway.."
      />
      <div className="StarRating center">
        {/* {[...Array(5)].map((start, index) => {
          const ratingValue = index + 1;
          return (
            <label key={auth.userId + index}>
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                onClick={() => rateHandler(ratingValue)}
              />
              <FaStar
                className="star"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={25}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover()}
              />
            </label>
          );
        })} */}
        <ReactStars
          className="star"
          value={rating}
          count={5}
          onChange={rateHandler}
          size={30}
          half={true}
          emptyIcon={<i className="far fa-star" />}
          halfIcon={<i className="fa fa-star-half-alt" />}
          fullIcon={<i className="fa fa-star" />}
          color1={"#e4e5e9"}
          color2={"#ffc107"}
        />
        <span className="ratings">{"(" + raterNumb + " ratings)"}</span>
      </div>
    </>
  );
}

export default StarRating;
