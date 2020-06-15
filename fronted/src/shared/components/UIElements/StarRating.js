import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";

import { FaStar } from "react-icons/fa";

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
  const [hover, setHover] = useState(null);
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
      {isLoading && <LoadingSpinner />}
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
      {/* <Modal
        show={showConfirmModal}
        onCancel={closeConfirmHandler}
        footerClass="place-item__modal-actions"
        footer={
          <>
            <Button inverse onClick={closeConfirmHandler}>
              CANCEL
            </Button>
            <Button danger onClick={() => patchRates(ratingSameUser)}>
              Rate
            </Button>
          </>
        }
      >
        <p>
          You've already rate this pleace, Do you want to change your rating
          anyway..
        </p>
      </Modal> */}
      <div>
        {[...Array(5)].map((start, index) => {
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
        })}
        <p className="average-rating">{`${rating.toFixed(1)}(${raterNumb})`}</p>
      </div>
    </>
  );
}

export default StarRating;
