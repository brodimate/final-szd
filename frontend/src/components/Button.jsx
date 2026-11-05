export default function Button({ children, type = "button", onClick, disabled }) {
  return (
    <>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`btn ${disabled ? "btn-disabled" : ""}`}
      >
        {children}
      </button>

      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          background: #58b499;
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: "Inter", sans-serif;
          box-shadow: 0 2px 5px rgba(88, 180, 153, 0.25);
        }

        .btn:hover {
          background: #4aa587;
          box-shadow: 0 3px 6px rgba(88, 180, 153, 0.35);
        }

        .btn:active {
          background: #3c8c71;
          transform: scale(0.98);
        }

        .btn-disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .btn {
            width: 100%;
            font-size: 14px;
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}
