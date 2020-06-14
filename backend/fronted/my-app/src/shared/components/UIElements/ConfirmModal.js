import React from "react";
import Modal from "./Modal";
import Button from "../FormElements/Button";

export default function ConfirmModal(props) {
  return (
    <Modal
      onCancel={props.onClear}
      header="Are you sure!"
      show={props.show}
      footer={
        <React.Fragment>
          <Button onClick={props.confirm}>Yes</Button>
          <Button onClick={props.onClear}>No</Button>
        </React.Fragment>
      }
    >
      <p>{props.message}</p>
    </Modal>
  );
}
