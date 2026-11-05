export default function Input({
  label,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
}) {
  return (
    <>
      <label className="form-label">
        {label && <div className="form-label-text">{label}</div>}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="form-input"
        />
      </label>

      <style>{`
        .form-label {
          display: block;
          width: 100%;
          margin-bottom: 16px;
          font-family: "Inter", sans-serif;
        }

        .form-label-text {
          margin-bottom: 6px;
          font-weight: 600;
          color: #333;
          font-size: 15px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d5d5d5;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
          background: #fff;
        }

        .form-input:focus {
          border-color: #58b499;
          box-shadow: 0 0 0 2px rgba(88, 180, 153, 0.15);
          outline: none;
        }

        .form-input::placeholder {
          color: #aaa;
        }

        @media (max-width: 768px) {
          .form-input {
            font-size: 14px;
            padding: 8px 10px;
          }
        }
      `}</style>
    </>
  );
}
