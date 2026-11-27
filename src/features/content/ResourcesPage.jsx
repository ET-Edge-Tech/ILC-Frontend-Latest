import { useSearchParams } from 'react-router-dom';
import GlimpsesView from './GlimpsesView.jsx';
import ResourcesView from './ResourcesView.jsx';

// /resources shows Knowledge. /resources?section=glimpses shows the photo gallery.
export default function ResourcesPage() {
  const [params] = useSearchParams();
  return params.get('section') === 'glimpses' ? <GlimpsesView /> : <ResourcesView />;
}
