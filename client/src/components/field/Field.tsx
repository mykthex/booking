export const Field = ({
  label,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  options,
  disabled = false,
  onChange,
  defaultValue,
}: {
  label: string;
  disabled?: boolean;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  value?: string | number;
  options?: { label: string; value: string | number }[]; // For select fields
  required?: boolean;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}) => {
  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <select
            id={name}
            defaultValue={defaultValue}
            name={name}
            required={required}
            onChange={(e) => onChange?.(e as any)}
            className="select w-full validator"
            disabled={disabled}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        const inputProps = {
          id: name,
          name,
          type,
          disabled,
          required,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e),
          placeholder,
          className: "input w-full validator"
        };

        // Use value for controlled components, defaultValue for uncontrolled
        if (value !== undefined) {
          return <input {...inputProps} value={value} />;
        } else {
          return <input {...inputProps} defaultValue={defaultValue} />;
        }
    }
  };

  return (
    <div className="mb-2">
      <label htmlFor={name} className="label">
        {label}
      </label>
      {renderInput()}
      <p className="validator-hint hidden">
        Field <strong>{label}</strong> is invalid
      </p>
    </div>
  );
};
