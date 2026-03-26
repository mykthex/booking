export const Field = ({
  label,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  options,
  onChange,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value: string;
  options?: { label: string; value: string }[]; // For select fields
  required?: boolean;
  onChange: (
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
            onChange={(e) => onChange(e as any)}
            className="select w-full validator"
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            required={required}
            onChange={onChange}
            placeholder={placeholder}
            className="input w-full validator"
          />
        );
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
