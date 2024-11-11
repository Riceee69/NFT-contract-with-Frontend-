import React from "react";

export function TransactionErrorMessage({ message, dismiss }) {
  return (
    <div className="" role="alert">
      Error sending transaction: {message.substring(0, 100)}
      <button
        type="button"
        className=""
        data-dismiss="alert"
        aria-label="Close"
        onClick={dismiss}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}
