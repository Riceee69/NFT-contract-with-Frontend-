import React from "react";

export function NetworkErrorMessage({ message, dismiss }) {
  return (
    <div className="" role="alert">
      {message}
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
