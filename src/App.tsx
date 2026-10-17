import { StudioView } from './components/StudioView';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <StudioView />
    </ErrorBoundary>
  );
}

export default App;
