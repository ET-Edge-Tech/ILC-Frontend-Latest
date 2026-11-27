import SelectField from '../../components/ui/SelectField.jsx';
import { useIndustries } from './hooks.js';

// Pick one industry from the list. value / onChange use the industry id ('' means not set).
export default function IndustrySelect({ value, onChange, label = 'Industry', disabled = false, className = '' }) {
  const { data: industries = [], isLoading } = useIndustries();
  return (
    <SelectField
      className={className}
      label={label}
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => onChange(e.target.value)}
      options={[{ value: '', label: isLoading ? 'Loading…' : 'Not set' }, ...industries.map((i) => ({ value: i.id, label: i.name }))]}
    />
  );
}
