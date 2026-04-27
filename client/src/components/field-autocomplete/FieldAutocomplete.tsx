import { useState, useRef, useEffect } from "react";

export const FieldAutocomplete = ({
  label,
  name,
  placeholder,
  required = false,
  options,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
  name: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[]; // For select fields
  required?: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options || []);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionClickedRef = useRef(false);

  const handleInputChange = (inputValue: string) => {
    optionClickedRef.current = false; // Reset flag when user types
    setDisplayValue(inputValue);
    setSelectedValue(""); // Clear selected value when user types
    setShowValidationError(false); // Reset validation error while typing
    const filtered = options?.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    ) || [];
    setFilteredOptions(filtered);
    setShowDropdown(filtered.length > 0 && inputValue.length > 0);
  };

  const handleOptionClick = (option: { label: string; value: string | number }) => {
    optionClickedRef.current = true;
    setDisplayValue(option.label);
    setSelectedValue(option.value.toString());
    setShowValidationError(false);
    if (inputRef.current) {
      inputRef.current.setCustomValidity("");
      inputRef.current.setAttribute("aria-invalid", "false");
    }
    setShowDropdown(false);
    setFilteredOptions([]);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      optionClickedRef.current = false;
    }, 100);
  };

  // Clear validation on mount and when required changes
  useEffect(() => {
    if (inputRef.current && !required) {
      inputRef.current.setCustomValidity("");
      inputRef.current.setAttribute("aria-invalid", "false");
    }
    setShowValidationError(false);
  }, [required]);

  const validateInput = () => {
    // Don't validate if we already have a selected value (option was clicked)
    if (selectedValue) {
      if (inputRef.current) {
        inputRef.current.setCustomValidity("");
        inputRef.current.setAttribute("aria-invalid", "false");
      }
      setShowValidationError(false);
      return;
    }

    if (!displayValue) {
      if (inputRef.current) {
        inputRef.current.setCustomValidity("");
        inputRef.current.setAttribute("aria-invalid", "false");
      }
      setShowValidationError(false);
      return;
    }
    
    const exactMatch = options?.find((option) => 
      option.label.toLowerCase() === displayValue.toLowerCase()
    );
    
    if (exactMatch) {
      setSelectedValue(exactMatch.value.toString());
      if (inputRef.current) {
        inputRef.current.setCustomValidity("");
        inputRef.current.setAttribute("aria-invalid", "false");
      }
      setShowValidationError(false);
    } else {
      if (inputRef.current) {
        inputRef.current.setCustomValidity("Please select a valid option from the list.");
        inputRef.current.setAttribute("aria-invalid", "true");
      }
      setShowValidationError(true);
    }
  };

  const inputProps = {
    id: name,
    disabled,
    required,
    placeholder,
    className: "input w-full validator"
  };

  return (
    <div className="mb-2">
      <label htmlFor={name} className="label">
        {label}
      </label>
      <div className="wrapper relative">
        {/* Hidden input for form submission with actual value */}
        <input
          type="hidden"
          name={name}
          value={selectedValue}
        />
        {/* Display input for user interaction */}
        <input
          {...inputProps}
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (displayValue) {
              const filtered = options?.filter((option) =>
                option.label.toLowerCase().includes(displayValue.toLowerCase())
              ) || [];
              setFilteredOptions(filtered);
              setShowDropdown(filtered.length > 0);
            }
          }}
          onBlur={() => {
            // Delay hiding dropdown to allow clicks
            setTimeout(() => {
              setShowDropdown(false);
              // Only validate if user manually typed and didn't just click an option
              if (!optionClickedRef.current) {
                validateInput();
              }
            }, 150);
          }}
          autoComplete="off"
        />
        {showDropdown && filteredOptions.length > 0 && (
          <ul className="autocomplete-options absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOptionClick(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
        <p className={`validator-hint ${showValidationError ? 'visible' : 'hidden'}`}>
          Field <strong>{label}</strong> must be selected from available options
        </p>
      </div>
    </div>
  );
};
